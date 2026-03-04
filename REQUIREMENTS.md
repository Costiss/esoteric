I want to create a Esotheric Services marketplace. Similar to "Marido de Aluguel" but for Esotheric Services.

- The service will run on Brazil
- The platform will connect customers with Esotheric Service providers (like Tarot readers, Astrologers, Reiki practitioners, etc.)
- The platform will allow customers to book appointments, make payments, and leave reviews for the service
- The platform will also allow service providers to create profiles, list their services, and manage their appointments and payments
- The platform will have a user-friendly interface and will be accessible via web and mobile devices
- The platform will also have a secure payment system to ensure the safety of transactions (like Stripe, PagSeguro, MercadoPago, etc.)
- The platform will also have a customer support system to assist users with any issues they may encounter (email support)
- The platform needs a different user interface with animations reminding astrology, tarot, and other esoteric themes to create an engaging experience for users (stardust IOS app is a example)

# Technical requirements:

## Backend:

- The backend will be built using Rust with Axum framework for handling API requests and managing the database
- The backend will serve in HTTP/2 for improved performance and security
- The backend will use a PostgreSQL database to store user information, service listings, appointments, (use Diesel ORM for database interactions)

## Frontend

- The frontend will be a mobile application built with React Native for cross-platform compatibility (iOS and Android)
- The frontend will communicate with the backend via RESTful API endpoints
- The frontend will have a visually appealing design with animations and themes related to astrology, tarot,
- Use Tamagui for as component library
- Strict Typescript is mandatory
- Use Biome for code formatting and linting to maintain code quality and consistency across the project
  - Add the rule that prohibits the use of the `any` type in TypeScript to ensure type safety and maintainability of the codebase
- Prefer popular modern libraries that resembles the Web Ecossytem of Tanstack Start, Shadcn/UI and similar, but for React Native, to ensure a consistent and efficient development process while maintaining a high-quality user interface
- Use Expo

## Authentication

- Implement the OAUTH 2.0 protocol for secure authentication and authorization of users
  - For now, we dont need to share any data with third-party services, so we can implement a custom OAUTH 2.0 server to handle user authentication and authorization within our platform. This will allow us to securely manage user sessions and permissions without relying on external providers.
