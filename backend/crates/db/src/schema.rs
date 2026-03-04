use diesel::prelude::*;

table! {
    users (id) {
        id -> Text,
        email -> Citext,
        password_hash -> Nullable<Text>,
        role -> Text,
        is_active -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

table! {
    services (id) {
        id -> Text,
        provider_id -> Text,
        title -> Text,
        description -> Nullable<Text>,
        duration_minutes -> Integer,
        price_cents -> Integer,
        currency -> Text,
        tags -> Nullable<Array<Text>>,
        metadata -> Nullable<Jsonb>,
        is_published -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

joinable!(services -> users (provider_id));
allow_tables_to_appear_in_same_query!(users, services);
