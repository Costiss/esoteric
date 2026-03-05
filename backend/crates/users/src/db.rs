use crate::error::UserError;
use crate::models::{CreateUserRequest, NewUser, UpdateUserRequest, User};
use common::ulid_new;
use diesel::prelude::*;
use diesel::r2d2::{ConnectionManager, Pool, PooledConnection};

pub type DbPool = Pool<ConnectionManager<diesel::pg::PgConnection>>;
pub type DbConnection = PooledConnection<ConnectionManager<diesel::pg::PgConnection>>;

pub fn hash_password(password: &str) -> Result<String, UserError> {
    bcrypt::hash(password, 10).map_err(|e| UserError::Hashing(e.to_string()))
}

pub fn verify_password(password: &str, hash: &str) -> Result<bool, UserError> {
    bcrypt::verify(password, hash).map_err(|e| UserError::Hashing(e.to_string()))
}

pub fn create_user(conn: &mut DbConnection, request: CreateUserRequest) -> Result<User, UserError> {
    use db::schema::users::dsl::users;

    let email_lower = request.email.to_lowercase();

    let existing: Option<User> = users
        .filter(db::schema::users::email.eq(&email_lower))
        .first(conn)
        .optional()
        .map_err(UserError::Database)?;

    if existing.is_some() {
        return Err(UserError::EmailExists);
    }

    let hashed_password = if request.password.is_empty() {
        None
    } else {
        Some(hash_password(&request.password)?)
    };

    let role_value = request.role.unwrap_or_else(|| "customer".to_string());

    let new_user = NewUser {
        id: ulid_new(),
        email: email_lower,
        password_hash: hashed_password,
        role: role_value,
    };

    diesel::insert_into(users)
        .values(&new_user)
        .returning(User::as_select())
        .get_result(conn)
        .map_err(UserError::Database)
}

pub fn get_user_by_id(conn: &mut DbConnection, user_id: &str) -> Result<User, UserError> {
    use db::schema::users::dsl::users;

    users
        .filter(db::schema::users::id.eq(user_id))
        .first(conn)
        .map_err(|e| match e {
            diesel::result::Error::NotFound => UserError::NotFound,
            _ => UserError::Database(e),
        })
}

pub fn get_user_by_email(conn: &mut DbConnection, email_input: &str) -> Result<User, UserError> {
    use db::schema::users::dsl::users;

    let email_lower = email_input.to_lowercase();
    users
        .filter(db::schema::users::email.eq(&email_lower))
        .first(conn)
        .map_err(|e| match e {
            diesel::result::Error::NotFound => UserError::NotFound,
            _ => UserError::Database(e),
        })
}

pub fn update_user(
    conn: &mut DbConnection,
    user_id: &str,
    request: UpdateUserRequest,
) -> Result<User, UserError> {
    use db::schema::users::dsl::users;

    let user = get_user_by_id(conn, user_id)?;

    let email_value = if let Some(new_email) = request.email {
        let email_lower = new_email.to_lowercase();

        let existing: Option<User> = users
            .filter(db::schema::users::email.eq(&email_lower))
            .filter(db::schema::users::id.ne(user_id))
            .first(conn)
            .optional()
            .map_err(UserError::Database)?;

        if existing.is_some() {
            return Err(UserError::EmailExists);
        }

        email_lower
    } else {
        user.email
    };

    diesel::update(users.filter(db::schema::users::id.eq(user_id)))
        .set((
            db::schema::users::email.eq(email_value),
            db::schema::users::updated_at.eq(chrono::Utc::now()),
        ))
        .returning(User::as_select())
        .get_result(conn)
        .map_err(UserError::Database)
}

pub fn update_password(
    conn: &mut DbConnection,
    user_id: &str,
    new_password: &str,
) -> Result<User, UserError> {
    use db::schema::users::dsl::users;

    let hashed_password = hash_password(new_password)?;

    diesel::update(users.filter(db::schema::users::id.eq(user_id)))
        .set((
            db::schema::users::password_hash.eq(hashed_password),
            db::schema::users::updated_at.eq(chrono::Utc::now()),
        ))
        .returning(User::as_select())
        .get_result(conn)
        .map_err(UserError::Database)
}

pub fn deactivate_user(conn: &mut DbConnection, user_id: &str) -> Result<User, UserError> {
    use db::schema::users::dsl::users;

    diesel::update(users.filter(db::schema::users::id.eq(user_id)))
        .set((
            db::schema::users::is_active.eq(false),
            db::schema::users::updated_at.eq(chrono::Utc::now()),
        ))
        .returning(User::as_select())
        .get_result(conn)
        .map_err(UserError::Database)
}
