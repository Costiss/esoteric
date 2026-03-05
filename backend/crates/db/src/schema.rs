use diesel::prelude::*;

table! {
    users (id) {
        id -> Char,
        email -> Text,
        password_hash -> Nullable<Text>,
        role -> Text,
        is_active -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

table! {
    services (id) {
        id -> Char,
        provider_id -> Char,
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

table! {
    oauth_clients (id) {
        id -> Char,
        client_id -> Text,
        client_name -> Text,
        client_secret_hash -> Nullable<Text>,
        redirect_uris -> Jsonb,
        allowed_scopes -> Jsonb,
        is_confidential -> Bool,
        is_active -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

table! {
    refresh_tokens (id) {
        id -> Char,
        user_id -> Char,
        client_id -> Text,
        token_hash -> Text,
        scopes -> Jsonb,
        expires_at -> Timestamptz,
        revoked -> Bool,
        created_at -> Timestamptz,
    }
}

table! {
    providers (id) {
        id -> Char,
        user_id -> Char,
        display_name -> Text,
        bio -> Nullable<Text>,
        working_hours -> Nullable<Jsonb>,
        availability_settings -> Nullable<Jsonb>,
        is_verified -> Bool,
        is_active -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

table! {
    bookings (id) {
        id -> Char,
        service_id -> Char,
        customer_id -> Char,
        provider_id -> Char,
        start_ts -> Timestamptz,
        end_ts -> Timestamptz,
        status -> Text,
        price_cents -> Integer,
        currency -> Text,
        client_notes -> Nullable<Text>,
        provider_notes -> Nullable<Text>,
        cancellation_reason -> Nullable<Text>,
        cancelled_by -> Nullable<Char>,
        cancelled_at -> Nullable<Timestamptz>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

table! {
    payments (id) {
        id -> Char,
        booking_id -> Char,
        customer_id -> Char,
        provider_id -> Char,
        provider_type -> Text,
        provider_payment_id -> Nullable<Text>,
        provider_charge_id -> Nullable<Text>,
        amount_cents -> Integer,
        currency -> Char,
        status -> Text,
        payment_method_id -> Nullable<Text>,
        customer_email -> Nullable<Text>,
        metadata -> Nullable<Jsonb>,
        refunded_amount_cents -> Integer,
        commission_amount_cents -> Integer,
        paid_at -> Nullable<Timestamptz>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

joinable!(services -> providers (provider_id));
joinable!(refresh_tokens -> users (user_id));
joinable!(refresh_tokens -> oauth_clients (client_id));
joinable!(bookings -> services (service_id));
joinable!(bookings -> users (customer_id));
joinable!(bookings -> providers (provider_id));
joinable!(payments -> bookings (booking_id));
joinable!(payments -> users (customer_id));
joinable!(payments -> providers (provider_id));

allow_tables_to_appear_in_same_query!(
    users,
    services,
    oauth_clients,
    refresh_tokens,
    providers,
    bookings,
    payments
);
