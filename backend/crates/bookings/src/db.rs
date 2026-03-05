use crate::error::BookingError;
use crate::models::{Booking, NewBooking};
use common::ulid_new;
use diesel::prelude::*;
use diesel::r2d2::{ConnectionManager, Pool, PooledConnection};

pub type DbPool = Pool<ConnectionManager<diesel::pg::PgConnection>>;
pub type DbConnection = PooledConnection<ConnectionManager<diesel::pg::PgConnection>>;

pub fn create_booking(
    conn: &mut DbConnection,
    service_id: &str,
    customer_id: &str,
    provider_id: &str,
    start_ts: chrono::DateTime<chrono::Utc>,
    end_ts: chrono::DateTime<chrono::Utc>,
    price_cents: i32,
    currency: &str,
    client_notes: Option<String>,
) -> Result<Booking, BookingError> {
    use db::schema::bookings::dsl::bookings;

    if start_ts >= end_ts {
        return Err(BookingError::InvalidRequest(
            "Start time must be before end time".to_string(),
        ));
    }

    let existing = check_availability(conn, provider_id, start_ts, end_ts)?;
    if existing.is_some() {
        return Err(BookingError::Conflict(
            "Time slot is already booked".to_string(),
        ));
    }

    let new_booking = NewBooking {
        id: ulid_new(),
        service_id: service_id.to_string(),
        customer_id: customer_id.to_string(),
        provider_id: provider_id.to_string(),
        start_ts,
        end_ts,
        status: "requested".to_string(),
        price_cents,
        currency: currency.to_string(),
        client_notes,
    };

    diesel::insert_into(bookings)
        .values(&new_booking)
        .returning(Booking::as_select())
        .get_result(conn)
        .map_err(BookingError::Database)
}

pub fn check_availability(
    conn: &mut DbConnection,
    provider_id: &str,
    start_ts: chrono::DateTime<chrono::Utc>,
    end_ts: chrono::DateTime<chrono::Utc>,
) -> Result<Option<Booking>, BookingError> {
    use db::schema::bookings::dsl::bookings;

    let overlapping = bookings
        .filter(db::schema::bookings::provider_id.eq(provider_id))
        .filter(db::schema::bookings::status.ne("cancelled"))
        .filter(db::schema::bookings::start_ts.lt(end_ts))
        .filter(db::schema::bookings::end_ts.gt(start_ts))
        .first::<Booking>(conn)
        .optional()
        .map_err(BookingError::Database)?;

    Ok(overlapping)
}

pub fn get_booking_by_id(
    conn: &mut DbConnection,
    booking_id: &str,
) -> Result<Booking, BookingError> {
    use db::schema::bookings::dsl::bookings;

    bookings
        .filter(db::schema::bookings::id.eq(booking_id))
        .first(conn)
        .map_err(|e| match e {
            diesel::result::Error::NotFound => BookingError::NotFound,
            _ => BookingError::Database(e),
        })
}

pub fn get_bookings_by_customer(
    conn: &mut DbConnection,
    customer_id: &str,
    limit: i64,
    offset: i64,
) -> Result<Vec<Booking>, BookingError> {
    use db::schema::bookings::dsl::bookings;

    bookings
        .filter(db::schema::bookings::customer_id.eq(customer_id))
        .order(db::schema::bookings::created_at.desc())
        .limit(limit)
        .offset(offset)
        .load(conn)
        .map_err(BookingError::Database)
}

pub fn get_bookings_by_provider(
    conn: &mut DbConnection,
    provider_id: &str,
    limit: i64,
    offset: i64,
) -> Result<Vec<Booking>, BookingError> {
    use db::schema::bookings::dsl::bookings;

    bookings
        .filter(db::schema::bookings::provider_id.eq(provider_id))
        .order(db::schema::bookings::start_ts.asc())
        .limit(limit)
        .offset(offset)
        .load(conn)
        .map_err(BookingError::Database)
}

pub fn get_bookings_by_service(
    conn: &mut DbConnection,
    service_id: &str,
    limit: i64,
    offset: i64,
) -> Result<Vec<Booking>, BookingError> {
    use db::schema::bookings::dsl::bookings;

    bookings
        .filter(db::schema::bookings::service_id.eq(service_id))
        .order(db::schema::bookings::start_ts.asc())
        .limit(limit)
        .offset(offset)
        .load(conn)
        .map_err(BookingError::Database)
}

pub fn update_booking_status(
    conn: &mut DbConnection,
    booking_id: &str,
    new_status: &str,
    additional_fields: Option<(
        Option<String>,
        Option<String>,
        Option<String>,
        Option<chrono::DateTime<chrono::Utc>>,
    )>,
) -> Result<Booking, BookingError> {
    use db::schema::bookings::dsl::bookings;

    let booking = get_booking_by_id(conn, booking_id)?;

    let valid_transitions = match booking.status.as_str() {
        "requested" => vec!["confirmed", "cancelled"],
        "confirmed" => vec!["in_progress", "cancelled"],
        "in_progress" => vec!["completed", "cancelled"],
        _ => vec![],
    };

    if !valid_transitions.contains(&new_status) {
        return Err(BookingError::InvalidState);
    }

    let (provider_notes, cancellation_reason, cancelled_by, cancelled_at) =
        additional_fields.unwrap_or((None, None, None, None));

    let update_result = diesel::update(bookings.filter(db::schema::bookings::id.eq(booking_id)))
        .set((
            db::schema::bookings::status.eq(new_status),
            db::schema::bookings::provider_notes.eq(provider_notes),
            db::schema::bookings::cancellation_reason.eq(cancellation_reason),
            db::schema::bookings::cancelled_by.eq(cancelled_by),
            db::schema::bookings::cancelled_at.eq(cancelled_at),
            db::schema::bookings::updated_at.eq(chrono::Utc::now()),
        ))
        .returning(Booking::as_select())
        .get_result(conn);

    match update_result {
        Ok(b) => Ok(b),
        Err(diesel::result::Error::NotFound) => Err(BookingError::NotFound),
        Err(e) => Err(BookingError::Database(e)),
    }
}

pub fn cancel_booking(
    conn: &mut DbConnection,
    booking_id: &str,
    cancelled_by: &str,
    reason: &str,
) -> Result<Booking, BookingError> {
    let booking = get_booking_by_id(conn, booking_id)?;

    if booking.status == "cancelled" {
        return Err(BookingError::InvalidState);
    }

    if booking.status == "completed" {
        return Err(BookingError::InvalidState);
    }

    update_booking_status(
        conn,
        booking_id,
        "cancelled",
        Some((
            None,
            Some(reason.to_string()),
            Some(cancelled_by.to_string()),
            Some(chrono::Utc::now()),
        )),
    )
}

pub fn confirm_booking(conn: &mut DbConnection, booking_id: &str) -> Result<Booking, BookingError> {
    update_booking_status(conn, booking_id, "confirmed", None)
}

pub fn start_booking(conn: &mut DbConnection, booking_id: &str) -> Result<Booking, BookingError> {
    update_booking_status(conn, booking_id, "in_progress", None)
}

pub fn complete_booking(
    conn: &mut DbConnection,
    booking_id: &str,
    provider_notes: Option<String>,
) -> Result<Booking, BookingError> {
    update_booking_status(
        conn,
        booking_id,
        "completed",
        Some((provider_notes, None, None, None)),
    )
}

pub fn list_bookings(
    conn: &mut DbConnection,
    status: Option<&str>,
    limit: i64,
    offset: i64,
) -> Result<Vec<Booking>, BookingError> {
    use db::schema::bookings::dsl::bookings;

    let mut query = bookings.into_boxed();

    if let Some(status) = status {
        query = query.filter(db::schema::bookings::status.eq(status));
    }

    query
        .order(db::schema::bookings::created_at.desc())
        .limit(limit)
        .offset(offset)
        .load(conn)
        .map_err(BookingError::Database)
}
