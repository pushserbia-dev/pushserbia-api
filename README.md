# PushSerbia API

PushSerbia API is an open-source backend service that powers the PushSerbia platform, designed to connect developers and projects in Serbia.

## 📋 Table of Contents

- [Features](#features)
- [Technologies](#technologies)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
- [Usage](#usage)
  - [Running the Application](#running-the-application)
  - [API Endpoints](#api-endpoints)
- [Testing](#testing)
  - [Running Tests](#running-tests)
  - [Creating New Tests](#creating-new-tests)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## ✨ Features

- User authentication via Firebase
- LinkedIn OAuth integration
- Project management
- Voting system
- Queue management with Redis
- Email integration with Mailchimp

## 🛠️ Technologies

- [NestJS](https://nestjs.com/) - A progressive Node.js framework
- [TypeORM](https://typeorm.io/) - ORM for TypeScript and JavaScript
- [PostgreSQL](https://www.postgresql.org/) - Relational database
- [Redis](https://redis.io/) - In-memory data structure store (for queue management)
- [Firebase](https://firebase.google.com/) - Authentication
- [BullMQ](https://docs.bullmq.io/) - Queue management
- [Jest](https://jestjs.io/) - Testing framework

## 🚀 Getting Started

### Prerequisites

- Node.js (latest LTS version recommended)
- PostgreSQL database
- Redis server (for queue management)
- Firebase account (for authentication)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/pushserbia-api.git
   cd pushserbia-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Configuration

Create a `.env` file in the root directory with the following variables:

```
# Database
DATABASE_URL=postgres://username:password@localhost:5432/pushserbia

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=your_password
REDIS_URL=redis://default:your_password@localhost:6379

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_API_KEY=your_api_key

# Auth
AUTH_CALLBACK_URLS=http://localhost:4200,https://pushserbia.com
AUTH_PRODUCTION_LOGIN_PAGE=https://pushserbia.com/auth
AUTH_LOGIN_PAGE_URL=auth
AUTH_ACCOUNT_PAGE_URL=auth/redirect/linkedin

# LinkedIn OAuth
LINKEDIN_REDIRECT_URI=http://localhost:3000/v1/auth/redirect/linkedin?callback=
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret

# Mailchimp (optional)
MAILCHIMP_ENABLE=true
MAILCHIMP_TOKEN=your_mailchimp_token
MAILCHIMP_LIMIT=2000
```

## 📝 Usage

### Running the Application

- Development mode:
  ```bash
  npm run start:dev
  ```

- Debug mode:
  ```bash
  npm run start:debug
  ```

- Production mode:
  ```bash
  npm run start:prod
  ```

### API Endpoints

The API follows RESTful principles with all endpoints prefixed with `/v1`.

Main resources:
- `/v1/users` - User management
- `/v1/projects` - Project management
- `/v1/votes` - Voting system
- `/v1/auth` - Authentication endpoints

For detailed API documentation, please refer to the API documentation (coming soon).

## 🧪 Testing

### Running Tests

- Run all tests:
  ```bash
  npm test
  ```

- Run tests in watch mode:
  ```bash
  npm run test:watch
  ```

- Run tests with coverage:
  ```bash
  npm run test:cov
  ```

- Run E2E tests:
  ```bash
  npm run test:e2e
  ```

- Run specific test file:
  ```bash
  npm test -- path/to/test.spec.ts
  ```

### Creating New Tests

#### Unit Tests

Unit tests are located alongside the files they test with a `.spec.ts` extension. For example:

```typescript
// users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UserRepositoryService } from './user.repository';

describe('UsersService', () => {
  let service: UsersService;

  // Mock dependencies
  const mockUserRepository = {
    findOneBy: jest.fn(),
    // Add other methods as needed
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepositoryService,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add more test cases
});
```

#### E2E Tests

E2E tests are located in the `test` directory with a `.e2e-spec.ts` extension.

## 📁 Project Structure

- `src/`: Source code
  - `core/`: Core functionality (filters, config, repository base class)
  - `modules/`: Feature modules (users, projects, votes, auth)
  - `integrations/`: External service integrations (Mailchimp)
- `test/`: E2E tests
- `dist/`: Compiled output

## 👥 Contributing

We welcome contributions to the PushSerbia API project! Here's how you can contribute:

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Run tests to ensure everything works**:
   ```bash
   npm test
   ```
5. **Commit your changes**:
   ```bash
   git commit -m "Add some feature"
   ```
6. **Push to your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**

### Contribution Guidelines

- Follow the existing code style and formatting (ESLint and Prettier are configured)
- Write tests for new features or bug fixes
- Update documentation as needed
- Keep pull requests focused on a single feature or bug fix
- Be respectful and constructive in discussions

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

For questions or support, please open an issue on GitHub or contact the maintainers.

---

Made with ❤️ by the PushSerbia team
