pub use diesel::PgConnection;
pub use r2d2::PooledConnection;

pub type DbPool = r2d2::Pool<diesel::r2d2::ConnectionManager<PgConnection>>;
pub type PooledDb = PooledConnection<diesel::r2d2::ConnectionManager<PgConnection>>;

use crate::models::{NewPayment, Payment};
use diesel::prelude::*;
use diesel::result::Error as DieselError;

pub fn create_payment(
    conn: &mut PooledDb,
    new_payment: &NewPayment,
) -> Result<Payment, DieselError> {
    diesel::insert_into(db::schema::payments::table)
        .values(new_payment)
        .get_result(conn)
}

pub fn get_payment_by_id(conn: &mut PooledDb, payment_id: &str) -> Result<Payment, DieselError> {
    db::schema::payments::table
        .filter(db::schema::payments::id.eq(payment_id))
        .first(conn)
}

pub fn get_payment_by_booking_id(
    conn: &mut PooledDb,
    booking_id: &str,
) -> Result<Payment, DieselError> {
    db::schema::payments::table
        .filter(db::schema::payments::booking_id.eq(booking_id))
        .first(conn)
}

pub fn get_payment_by_provider_payment_id(
    conn: &mut PooledDb,
    provider_payment_id: &str,
) -> Result<Payment, DieselError> {
    db::schema::payments::table
        .filter(db::schema::payments::provider_payment_id.eq(provider_payment_id))
        .first(conn)
}

pub fn get_payments_by_customer(
    conn: &mut PooledDb,
    customer_id: &str,
) -> Result<Vec<Payment>, DieselError> {
    db::schema::payments::table
        .filter(db::schema::payments::customer_id.eq(customer_id))
        .order(db::schema::payments::created_at.desc())
        .load(conn)
}

pub fn get_payments_by_provider(
    conn: &mut PooledDb,
    provider_id: &str,
) -> Result<Vec<Payment>, DieselError> {
    db::schema::payments::table
        .filter(db::schema::payments::provider_id.eq(provider_id))
        .order(db::schema::payments::created_at.desc())
        .load(conn)
}

pub fn update_payment_status(
    conn: &mut PooledDb,
    payment_id: &str,
    status: &str,
) -> Result<Payment, DieselError> {
    diesel::update(db::schema::payments::table)
        .filter(db::schema::payments::id.eq(payment_id))
        .set((
            db::schema::payments::status.eq(status),
            db::schema::payments::updated_at.eq(chrono::Utc::now()),
        ))
        .get_result(conn)
}

pub fn update_payment_with_provider_id(
    conn: &mut PooledDb,
    payment_id: &str,
    provider_payment_id: &str,
    status: &str,
) -> Result<Payment, DieselError> {
    diesel::update(db::schema::payments::table)
        .filter(db::schema::payments::id.eq(payment_id))
        .set((
            db::schema::payments::provider_payment_id.eq(provider_payment_id),
            db::schema::payments::status.eq(status),
            db::schema::payments::updated_at.eq(chrono::Utc::now()),
        ))
        .get_result(conn)
}

pub fn mark_payment_succeeded(
    conn: &mut PooledDb,
    payment_id: &str,
    provider_charge_id: Option<&str>,
) -> Result<Payment, DieselError> {
    diesel::update(db::schema::payments::table)
        .filter(db::schema::payments::id.eq(payment_id))
        .set((
            db::schema::payments::status.eq("succeeded"),
            db::schema::payments::provider_charge_id.eq(provider_charge_id),
            db::schema::payments::paid_at.eq(Some(chrono::Utc::now())),
            db::schema::payments::updated_at.eq(chrono::Utc::now()),
        ))
        .get_result(conn)
}

pub fn update_payment_refund(
    conn: &mut PooledDb,
    payment_id: &str,
    refunded_amount_cents: i32,
) -> Result<Payment, DieselError> {
    let current = get_payment_by_id(conn, payment_id)?;
    let new_refunded = current.refunded_amount_cents + refunded_amount_cents;
    let status = if new_refunded >= current.amount_cents {
        "refunded"
    } else {
        "succeeded"
    };

    diesel::update(db::schema::payments::table)
        .filter(db::schema::payments::id.eq(payment_id))
        .set((
            db::schema::payments::refunded_amount_cents.eq(new_refunded),
            db::schema::payments::status.eq(status),
            db::schema::payments::updated_at.eq(chrono::Utc::now()),
        ))
        .get_result(conn)
}

pub fn delete_payment(conn: &mut PooledDb, payment_id: &str) -> Result<(), DieselError> {
    diesel::delete(db::schema::payments::table)
        .filter(db::schema::payments::id.eq(payment_id))
        .execute(conn)?;
    Ok(())
}
