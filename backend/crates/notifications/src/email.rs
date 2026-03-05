use async_trait::async_trait;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailRecipient {
    pub email: String,
    pub name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailContent {
    pub subject: String,
    pub body: String,
    pub is_html: bool,
}

#[async_trait]
pub trait EmailProvider: Send + Sync {
    async fn send_email(
        &self,
        to: &EmailRecipient,
        content: &EmailContent,
    ) -> Result<(), EmailError>;
}

#[derive(Debug, thiserror::Error)]
pub enum EmailError {
    #[error("Email configuration error: {0}")]
    Config(String),
    #[error("Failed to send email: {0}")]
    SendError(String),
    #[error("Email not implemented: {0}")]
    NotImplemented(String),
}

pub struct NoOpEmailProvider;

#[async_trait]
impl EmailProvider for NoOpEmailProvider {
    async fn send_email(
        &self,
        _to: &EmailRecipient,
        _content: &EmailContent,
    ) -> Result<(), EmailError> {
        Err(EmailError::NotImplemented(
            "Email sending not configured. Set SMTP configuration to enable.".to_string(),
        ))
    }
}

pub struct EmailService {
    provider: Box<dyn EmailProvider>,
}

impl Clone for EmailService {
    fn clone(&self) -> Self {
        Self {
            provider: Box::new(NoOpEmailProvider),
        }
    }
}

impl EmailService {
    pub fn new(provider: Box<dyn EmailProvider>) -> Self {
        Self { provider }
    }

    pub async fn send_booking_confirmation(
        &self,
        email: &str,
        booking_details: &str,
    ) -> Result<(), EmailError> {
        let recipient = EmailRecipient {
            email: email.to_string(),
            name: None,
        };
        let content = EmailContent {
            subject: "Booking Confirmed - Esotheric".to_string(),
            body: format!("Your booking has been confirmed.\n\n{}", booking_details),
            is_html: false,
        };
        self.provider.send_email(&recipient, &content).await
    }

    pub async fn send_booking_reminder(
        &self,
        email: &str,
        booking_details: &str,
    ) -> Result<(), EmailError> {
        let recipient = EmailRecipient {
            email: email.to_string(),
            name: None,
        };
        let content = EmailContent {
            subject: "Booking Reminder - Esotheric".to_string(),
            body: format!(
                "This is a reminder about your upcoming booking.\n\n{}",
                booking_details
            ),
            is_html: false,
        };
        self.provider.send_email(&recipient, &content).await
    }

    pub async fn send_booking_cancelled(
        &self,
        email: &str,
        booking_details: &str,
    ) -> Result<(), EmailError> {
        let recipient = EmailRecipient {
            email: email.to_string(),
            name: None,
        };
        let content = EmailContent {
            subject: "Booking Cancelled - Esotheric".to_string(),
            body: format!("Your booking has been cancelled.\n\n{}", booking_details),
            is_html: false,
        };
        self.provider.send_email(&recipient, &content).await
    }

    pub async fn send_payment_received(&self, email: &str, amount: &str) -> Result<(), EmailError> {
        let recipient = EmailRecipient {
            email: email.to_string(),
            name: None,
        };
        let content = EmailContent {
            subject: "Payment Received - Esotheric".to_string(),
            body: format!("Payment of {} has been successfully received.", amount),
            is_html: false,
        };
        self.provider.send_email(&recipient, &content).await
    }

    pub async fn send_support_reply(&self, email: &str, message: &str) -> Result<(), EmailError> {
        let recipient = EmailRecipient {
            email: email.to_string(),
            name: None,
        };
        let content = EmailContent {
            subject: "Support Response - Esotheric".to_string(),
            body: message.to_string(),
            is_html: false,
        };
        self.provider.send_email(&recipient, &content).await
    }
}
