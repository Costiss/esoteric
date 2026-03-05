use crate::error::ProviderError;
use crate::models::{CreateProviderRequest, NewProvider, Provider, UpdateProviderRequest};
use common::ulid_new;
use diesel::prelude::*;
use diesel::r2d2::{ConnectionManager, Pool, PooledConnection};

pub type DbPool = Pool<ConnectionManager<diesel::pg::PgConnection>>;
pub type DbConnection = PooledConnection<ConnectionManager<diesel::pg::PgConnection>>;

pub fn create_provider(
    conn: &mut DbConnection,
    user_id: &str,
    request: CreateProviderRequest,
) -> Result<Provider, ProviderError> {
    use db::schema::providers::dsl::providers;

    let existing: Option<Provider> = providers
        .filter(db::schema::providers::user_id.eq(user_id))
        .first(conn)
        .optional()
        .map_err(ProviderError::Database)?;

    if existing.is_some() {
        return Err(ProviderError::AlreadyProvider);
    }

    let new_provider = NewProvider {
        id: ulid_new(),
        user_id: user_id.to_string(),
        display_name: request.display_name,
        bio: request.bio,
        working_hours: request.working_hours,
        availability_settings: request.availability_settings,
    };

    diesel::insert_into(providers)
        .values(&new_provider)
        .returning(Provider::as_select())
        .get_result(conn)
        .map_err(ProviderError::Database)
}

pub fn get_provider_by_id(
    conn: &mut DbConnection,
    provider_id: &str,
) -> Result<Provider, ProviderError> {
    use db::schema::providers::dsl::providers;

    providers
        .filter(db::schema::providers::id.eq(provider_id))
        .filter(db::schema::providers::is_active.eq(true))
        .first(conn)
        .map_err(|e| match e {
            diesel::result::Error::NotFound => ProviderError::NotFound,
            _ => ProviderError::Database(e),
        })
}

pub fn get_provider_by_user_id(
    conn: &mut DbConnection,
    user_id: &str,
) -> Result<Provider, ProviderError> {
    use db::schema::providers::dsl::providers;

    providers
        .filter(db::schema::providers::user_id.eq(user_id))
        .filter(db::schema::providers::is_active.eq(true))
        .first(conn)
        .map_err(|e| match e {
            diesel::result::Error::NotFound => ProviderError::NotFound,
            _ => ProviderError::Database(e),
        })
}

pub fn update_provider(
    conn: &mut DbConnection,
    provider_id: &str,
    request: UpdateProviderRequest,
) -> Result<Provider, ProviderError> {
    use db::schema::providers::dsl::providers;

    let provider = get_provider_by_id(conn, provider_id)?;

    let display_name = request.display_name.unwrap_or(provider.display_name);
    let bio = request.bio.or(provider.bio);
    let working_hours = request.working_hours.or(provider.working_hours);
    let availability_settings = request
        .availability_settings
        .or(provider.availability_settings);

    diesel::update(providers.filter(db::schema::providers::id.eq(provider_id)))
        .set((
            db::schema::providers::display_name.eq(display_name),
            db::schema::providers::bio.eq(bio),
            db::schema::providers::working_hours.eq(working_hours),
            db::schema::providers::availability_settings.eq(availability_settings),
            db::schema::providers::updated_at.eq(chrono::Utc::now()),
        ))
        .returning(Provider::as_select())
        .get_result(conn)
        .map_err(ProviderError::Database)
}

pub fn verify_provider(
    conn: &mut DbConnection,
    provider_id: &str,
) -> Result<Provider, ProviderError> {
    use db::schema::providers::dsl::providers;

    diesel::update(providers.filter(db::schema::providers::id.eq(provider_id)))
        .set((
            db::schema::providers::is_verified.eq(true),
            db::schema::providers::updated_at.eq(chrono::Utc::now()),
        ))
        .returning(Provider::as_select())
        .get_result(conn)
        .map_err(ProviderError::Database)
}

pub fn deactivate_provider(
    conn: &mut DbConnection,
    provider_id: &str,
) -> Result<Provider, ProviderError> {
    use db::schema::providers::dsl::providers;

    diesel::update(providers.filter(db::schema::providers::id.eq(provider_id)))
        .set((
            db::schema::providers::is_active.eq(false),
            db::schema::providers::updated_at.eq(chrono::Utc::now()),
        ))
        .returning(Provider::as_select())
        .get_result(conn)
        .map_err(ProviderError::Database)
}

pub fn list_providers(
    conn: &mut DbConnection,
    limit: i64,
    offset: i64,
) -> Result<Vec<Provider>, ProviderError> {
    use db::schema::providers::dsl::providers;

    providers
        .filter(db::schema::providers::is_active.eq(true))
        .order(db::schema::providers::created_at.desc())
        .limit(limit)
        .offset(offset)
        .load(conn)
        .map_err(ProviderError::Database)
}

pub fn list_verified_providers(
    conn: &mut DbConnection,
    limit: i64,
    offset: i64,
) -> Result<Vec<Provider>, ProviderError> {
    use db::schema::providers::dsl::providers;

    providers
        .filter(db::schema::providers::is_active.eq(true))
        .filter(db::schema::providers::is_verified.eq(true))
        .order(db::schema::providers::created_at.desc())
        .limit(limit)
        .offset(offset)
        .load(conn)
        .map_err(ProviderError::Database)
}
