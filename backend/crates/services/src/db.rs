use crate::error::ServiceError;
use crate::models::{CreateServiceRequest, NewService, Service, UpdateServiceRequest};
use common::ulid_new;
use diesel::prelude::*;
use diesel::r2d2::{ConnectionManager, Pool, PooledConnection};

pub type DbPool = Pool<ConnectionManager<diesel::pg::PgConnection>>;
pub type DbConnection = PooledConnection<ConnectionManager<diesel::pg::PgConnection>>;

pub fn create_service(
    conn: &mut DbConnection,
    provider_id: &str,
    request: CreateServiceRequest,
) -> Result<Service, ServiceError> {
    use db::schema::services::dsl::services;

    let new_service = NewService {
        id: ulid_new(),
        provider_id: provider_id.to_string(),
        title: request.title,
        description: request.description,
        duration_minutes: request.duration_minutes,
        price_cents: request.price_cents,
        currency: request.currency.unwrap_or_else(|| "BRL".to_string()),
        tags: request.tags,
        metadata: request.metadata,
        is_published: false,
    };

    diesel::insert_into(services)
        .values(&new_service)
        .returning(Service::as_select())
        .get_result(conn)
        .map_err(ServiceError::Database)
}

pub fn get_service_by_id(
    conn: &mut DbConnection,
    service_id: &str,
) -> Result<Service, ServiceError> {
    use db::schema::services::dsl::services;

    services
        .filter(db::schema::services::id.eq(service_id))
        .first(conn)
        .map_err(|e| match e {
            diesel::result::Error::NotFound => ServiceError::NotFound,
            _ => ServiceError::Database(e),
        })
}

pub fn get_published_service_by_id(
    conn: &mut DbConnection,
    service_id: &str,
) -> Result<Service, ServiceError> {
    use db::schema::services::dsl::services;

    services
        .filter(db::schema::services::id.eq(service_id))
        .filter(db::schema::services::is_published.eq(true))
        .first(conn)
        .map_err(|e| match e {
            diesel::result::Error::NotFound => ServiceError::NotFound,
            _ => ServiceError::Database(e),
        })
}

pub fn get_services_by_provider(
    conn: &mut DbConnection,
    provider_id: &str,
    limit: i64,
    offset: i64,
) -> Result<Vec<Service>, ServiceError> {
    use db::schema::services::dsl::services;

    services
        .filter(db::schema::services::provider_id.eq(provider_id))
        .order(db::schema::services::created_at.desc())
        .limit(limit)
        .offset(offset)
        .load(conn)
        .map_err(ServiceError::Database)
}

pub fn update_service(
    conn: &mut DbConnection,
    service_id: &str,
    request: UpdateServiceRequest,
) -> Result<Service, ServiceError> {
    use db::schema::services::dsl::services;

    let service = get_service_by_id(conn, service_id)?;

    let title = request.title.unwrap_or(service.title);
    let description = request.description.or(service.description);
    let duration_minutes = request.duration_minutes.unwrap_or(service.duration_minutes);
    let price_cents = request.price_cents.unwrap_or(service.price_cents);
    let currency = request.currency.unwrap_or(service.currency);
    let tags = request.tags.or(service.tags);
    let metadata = request.metadata.or(service.metadata);

    diesel::update(services.filter(db::schema::services::id.eq(service_id)))
        .set((
            db::schema::services::title.eq(title),
            db::schema::services::description.eq(description),
            db::schema::services::duration_minutes.eq(duration_minutes),
            db::schema::services::price_cents.eq(price_cents),
            db::schema::services::currency.eq(currency),
            db::schema::services::tags.eq(tags),
            db::schema::services::metadata.eq(metadata),
            db::schema::services::updated_at.eq(chrono::Utc::now()),
        ))
        .returning(Service::as_select())
        .get_result(conn)
        .map_err(ServiceError::Database)
}

pub fn publish_service(conn: &mut DbConnection, service_id: &str) -> Result<Service, ServiceError> {
    use db::schema::services::dsl::services;

    diesel::update(services.filter(db::schema::services::id.eq(service_id)))
        .set((
            db::schema::services::is_published.eq(true),
            db::schema::services::updated_at.eq(chrono::Utc::now()),
        ))
        .returning(Service::as_select())
        .get_result(conn)
        .map_err(|e| match e {
            diesel::result::Error::NotFound => ServiceError::NotFound,
            _ => ServiceError::Database(e),
        })
}

pub fn unpublish_service(
    conn: &mut DbConnection,
    service_id: &str,
) -> Result<Service, ServiceError> {
    use db::schema::services::dsl::services;

    diesel::update(services.filter(db::schema::services::id.eq(service_id)))
        .set((
            db::schema::services::is_published.eq(false),
            db::schema::services::updated_at.eq(chrono::Utc::now()),
        ))
        .returning(Service::as_select())
        .get_result(conn)
        .map_err(|e| match e {
            diesel::result::Error::NotFound => ServiceError::NotFound,
            _ => ServiceError::Database(e),
        })
}

pub fn delete_service(conn: &mut DbConnection, service_id: &str) -> Result<(), ServiceError> {
    use db::schema::services::dsl::services;

    let rows = diesel::delete(services.filter(db::schema::services::id.eq(service_id)))
        .execute(conn)
        .map_err(ServiceError::Database)?;

    if rows == 0 {
        return Err(ServiceError::NotFound);
    }

    Ok(())
}

pub fn list_published_services(
    conn: &mut DbConnection,
    limit: i64,
    offset: i64,
) -> Result<Vec<Service>, ServiceError> {
    use db::schema::services::dsl::services;

    services
        .filter(db::schema::services::is_published.eq(true))
        .order(db::schema::services::created_at.desc())
        .limit(limit)
        .offset(offset)
        .load(conn)
        .map_err(ServiceError::Database)
}

pub fn search_services(
    conn: &mut DbConnection,
    tag: Option<&str>,
    min_price: Option<i32>,
    max_price: Option<i32>,
    provider_verified_only: bool,
    limit: i64,
    offset: i64,
) -> Result<Vec<Service>, ServiceError> {
    use db::schema::providers::dsl::providers;
    use db::schema::services::dsl::services;

    let mut query = services
        .filter(db::schema::services::is_published.eq(true))
        .inner_join(providers)
        .select(Service::as_select())
        .into_boxed();

    if let Some(tag) = tag {
        query = query.filter(db::schema::services::tags.contains(vec![tag]));
    }

    if let Some(min) = min_price {
        query = query.filter(db::schema::services::price_cents.ge(min));
    }

    if let Some(max) = max_price {
        query = query.filter(db::schema::services::price_cents.le(max));
    }

    if provider_verified_only {
        query = query.filter(db::schema::providers::is_verified.eq(true));
    }

    query
        .order(db::schema::services::created_at.desc())
        .limit(limit)
        .offset(offset)
        .load(conn)
        .map_err(ServiceError::Database)
}
