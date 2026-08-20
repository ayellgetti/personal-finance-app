export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "example API",
    version: "0.0.0",
    description:
      "Express + Prisma API with a standard envelope (`status`, `data`, `message`, `timestamp`, `requestId`). Send `Authorization: Bearer <accessToken>` on protected routes. Optional `x-request-id` is echoed on every response.",
  },
  servers: [
    {
      url: "http://localhost:5001",
      description: "Local development",
    },
  ],
  tags: [
    { name: "Health", description: "Liveness and sample routes" },
    { name: "Auth", description: "Register, login, refresh, logout, and forgot password" },
    { name: "OTP", description: "Generate, resend, and verify one-time passwords" },
    { name: "Devices", description: "Register and remove authenticated user devices" },
    { name: "Users", description: "Authenticated user profile" },
    { name: "FinancialProfile", description: "Retirement age, dependents, inflation, and employment" },
    { name: "Budgets", description: "Authenticated user budgets" },
    { name: "Loans", description: "Authenticated user loans" },
    { name: "Investments", description: "Authenticated user investments" },
    { name: "Goals", description: "Authenticated user savings goals" },
    { name: "Planner", description: "Aggregated financial report for the current user" },
    {
      name: "Advisor",
      description: "OpenAI-assisted financial guidance grounded in planner calculations",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Access token from register, login, or refresh.",
      },
    },
    parameters: {
      RequestId: {
        name: "x-request-id",
        in: "header",
        required: false,
        schema: { type: "string", format: "uuid" },
        description: "Optional correlation ID. Generated if omitted.",
      },
    },
    schemas: {
      Envelope: {
        type: "object",
        required: ["status", "data", "message", "timestamp", "requestId"],
        properties: {
          status: { type: "boolean" },
          data: {},
          message: { type: "string" },
          timestamp: { type: "string", format: "date-time" },
          requestId: { type: "string" },
          metadata: { type: "object", additionalProperties: true },
        },
      },
      ErrorEnvelope: {
        allOf: [
          { $ref: "#/components/schemas/Envelope" },
          {
            type: "object",
            properties: {
              status: { type: "boolean", example: false },
              data: { nullable: true },
            },
          },
        ],
      },
      ValidationError: {
        allOf: [
          { $ref: "#/components/schemas/ErrorEnvelope" },
          {
            type: "object",
            properties: {
              message: { type: "string", example: "Validation failed" },
              data: {
                type: "object",
                properties: {
                  formErrors: { type: "array", items: { type: "string" } },
                  fieldErrors: {
                    type: "object",
                    additionalProperties: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        ],
      },
      PublicUser: {
        type: "object",
        required: [
          "id",
          "firstName",
          "lastName",
          "dob",
          "gender",
          "mobileNo",
          "email",
          "isActive",
          "createdAt",
          "updatedAt",
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          firstName: { type: "string", example: "Ada" },
          lastName: { type: "string", example: "Lovelace" },
          dob: { type: "string", format: "date-time" },
          gender: { type: "string", example: "female" },
          mobileNo: { type: "string", example: "9876543210" },
          email: { type: "string", format: "email" },
          avatar: { type: "string", nullable: true },
          avatarBackground: { type: "string", nullable: true },
          quickStep: { type: "integer", example: 0, description: "1 hides Quick Setup after finish" },
          isActive: { type: "integer", example: 1 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      TokenPair: {
        type: "object",
        required: ["accessToken", "refreshToken", "user"],
        properties: {
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
          user: { $ref: "#/components/schemas/PublicUser" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: [
          "firstName",
          "lastName",
          "dob",
          "gender",
          "mobileNo",
          "email",
          "password",
          "no",
        ],
        properties: {
          firstName: { type: "string", minLength: 1, maxLength: 80 },
          lastName: { type: "string", minLength: 1, maxLength: 80 },
          dob: { type: "string", format: "date", example: "1990-05-01" },
          gender: { type: "string", minLength: 1, maxLength: 20 },
          mobileNo: {
            type: "string",
            pattern: "^\\+?[0-9]{7,15}$",
            example: "9876543210",
          },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8, maxLength: 72 },
          no: { type: "integer", minimum: 100000, maximum: 999999, example: 123456 },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
      RefreshRequest: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string" },
        },
      },
      UpdateMeRequest: {
        type: "object",
        minProperties: 1,
        properties: {
          firstName: { type: "string", minLength: 1, maxLength: 80 },
          lastName: { type: "string", minLength: 1, maxLength: 80 },
          gender: { type: "string", minLength: 1, maxLength: 20 },
          avatar: { type: "string", maxLength: 2048, nullable: true },
          avatarBackground: { type: "string", maxLength: 2048, nullable: true },
          quickStep: { type: "integer", minimum: 0, maximum: 1, example: 1 },
        },
      },
      ForgotPasswordRequest: {
        type: "object",
        required: ["mobileNo", "no", "password"],
        properties: {
          mobileNo: {
            type: "string",
            pattern: "^\\+?[0-9]{7,15}$",
            example: "9876543210",
          },
          no: { type: "integer", minimum: 100000, maximum: 999999, example: 123456 },
          password: { type: "string", minLength: 8, maxLength: 72 },
        },
      },
      ChangePasswordRequest: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: {
          currentPassword: { type: "string" },
          newPassword: { type: "string", minLength: 8, maxLength: 72 },
        },
      },
      FinancialProfileRequest: {
        type: "object",
        required: ["retirementAge", "dependents", "inflationRate", "employmentType", "currency"],
        properties: {
          retirementAge: { type: "integer", minimum: 30, maximum: 90, example: 60 },
          dependents: { type: "integer", minimum: 0, maximum: 20, example: 2 },
          inflationRate: { type: "number", minimum: 0, maximum: 30, example: 6 },
          employmentType: {
            type: "string",
            enum: ["Salaried", "Business Owner", "Freelancer", "Retired"],
          },
          currency: { type: "string", example: "₹" },
        },
      },
      OtpRequest: {
        type: "object",
        required: ["mobileNo", "type"],
        properties: {
          mobileNo: {
            type: "string",
            pattern: "^\\+?[0-9]{7,15}$",
            example: "9876543210",
          },
          type: { type: "string", enum: ["register", "forgot-password"], example: "register" },
        },
      },
      VerifyOtpRequest: {
        type: "object",
        required: ["mobileNo", "type", "no"],
        properties: {
          mobileNo: {
            type: "string",
            pattern: "^\\+?[0-9]{7,15}$",
            example: "9876543210",
          },
          type: { type: "string", enum: ["register", "forgot-password"], example: "register" },
          no: { type: "integer", minimum: 100000, maximum: 999999, example: 123456 },
        },
      },
      AddDeviceRequest: {
        type: "object",
        required: ["device", "deviceType"],
        properties: {
          device: { type: "string", example: "Pixel 8" },
          deviceType: { type: "string", example: "android" },
          os: { type: "string", example: "Android 15" },
          version: { type: "string", example: "1.0.0" },
          token: { type: "string", description: "Push notification token" },
          data: { type: "object", additionalProperties: true },
        },
      },
      RemoveDeviceRequest: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", format: "uuid" },
        },
      },
      Budget: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          type: { type: "string", example: "expense" },
          category: { type: "string", example: "expense" },
          subcategory: { type: "string", example: "groceries" },
          title: { type: "string", example: "Groceries" },
          description: { type: "string", nullable: true },
          amount: { type: "number", example: 1000 },
          monthDay: { type: "integer", minimum: 1, maximum: 31, nullable: true },
          weekDay: {
            type: "integer",
            minimum: 1,
            maximum: 7,
            nullable: true,
            description: "ISO weekday. 1 is Monday.",
          },
          repeatCount: { type: "integer", minimum: 1, nullable: true },
          isActive: { type: "integer", example: 1 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateBudgetRequest: {
        type: "object",
        required: ["type", "category", "subcategory", "title", "amount"],
        properties: {
          type: { type: "string" },
          category: { type: "string" },
          subcategory: { type: "string" },
          title: { type: "string" },
          description: { type: "string", nullable: true },
          amount: { type: "number", minimum: 0 },
          monthDay: { type: "integer", minimum: 1, maximum: 31, nullable: true },
          weekDay: { type: "integer", minimum: 1, maximum: 7, nullable: true },
          repeatCount: { type: "integer", minimum: 1, maximum: 31, nullable: true },
        },
      },
      UpdateBudgetRequest: {
        type: "object",
        minProperties: 1,
        properties: {
          type: { type: "string" },
          category: { type: "string" },
          subcategory: { type: "string" },
          title: { type: "string" },
          description: { type: "string", nullable: true },
          amount: { type: "number", minimum: 0 },
          monthDay: { type: "integer", minimum: 1, maximum: 31, nullable: true },
          weekDay: { type: "integer", minimum: 1, maximum: 7, nullable: true },
          repeatCount: { type: "integer", minimum: 1, maximum: 31, nullable: true },
        },
      },
      Loan: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          title: { type: "string", nullable: true },
          type: { type: "string", example: "Home Loan" },
          principalPendingAmount: { type: "number", example: 6730000 },
          roi: { type: "number", example: 7.35 },
          remainingMonths: { type: "integer", example: 131 },
          emiAmount: { type: "number", example: 75000 },
          emiDay: { type: "integer", example: 10, description: "Day of the month the EMI is due (1–31)" },
          isActive: { type: "integer", example: 1 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateLoanRequest: {
        type: "object",
        required: [
          "type",
          "principalPendingAmount",
          "roi",
          "remainingMonths",
          "emiAmount",
          "emiDay",
        ],
        properties: {
          title: { type: "string", nullable: true },
          type: { type: "string", example: "Home Loan" },
          principalPendingAmount: { type: "number", minimum: 0 },
          roi: { type: "number", minimum: 0, maximum: 100 },
          remainingMonths: { type: "integer", minimum: 0, maximum: 600 },
          emiAmount: { type: "number", minimum: 0 },
          emiDay: { type: "integer", minimum: 1, maximum: 31, description: "Day of the month the EMI is due" },
        },
      },
      UpdateLoanRequest: {
        type: "object",
        minProperties: 1,
        properties: {
          title: { type: "string", nullable: true },
          type: { type: "string", example: "Home Loan" },
          principalPendingAmount: { type: "number", minimum: 0 },
          roi: { type: "number", minimum: 0, maximum: 100 },
          remainingMonths: { type: "integer", minimum: 0, maximum: 600 },
          emiAmount: { type: "number", minimum: 0 },
          emiDay: { type: "integer", minimum: 1, maximum: 31, description: "Day of the month the EMI is due" },
        },
      },
      RemoveByIdRequest: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", format: "uuid" },
        },
      },
      Investment: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          category: { type: "string", example: "investment" },
          subcategory: { type: "string", example: "ppf" },
          title: { type: "string", nullable: true, example: "PPF" },
          accumulatedAmount: { type: "number", example: 300000 },
          roi: { type: "number", example: 7 },
          remainingMonths: { type: "integer", example: 48 },
          investmentAmount: { type: "number", example: 7500 },
          monthDay: { type: "integer", example: 5 },
          onHold: { type: "integer", example: 0 },
          isActive: { type: "integer", example: 1 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateInvestmentRequest: {
        type: "object",
        required: [
          "subcategory",
          "accumulatedAmount",
          "roi",
          "remainingMonths",
          "investmentAmount",
          "monthDay",
        ],
        properties: {
          category: { type: "string", example: "investment" },
          subcategory: { type: "string", example: "ppf" },
          title: { type: "string", nullable: true },
          accumulatedAmount: { type: "number", minimum: 0 },
          roi: { type: "number", minimum: 0, maximum: 100 },
          remainingMonths: { type: "integer", minimum: 0, maximum: 600 },
          investmentAmount: { type: "number", minimum: 0 },
          monthDay: { type: "integer", minimum: 1, maximum: 31 },
        },
      },
      UpdateInvestmentRequest: {
        type: "object",
        minProperties: 1,
        properties: {
          category: { type: "string" },
          subcategory: { type: "string" },
          title: { type: "string", nullable: true },
          accumulatedAmount: { type: "number", minimum: 0 },
          roi: { type: "number", minimum: 0, maximum: 100 },
          remainingMonths: { type: "integer", minimum: 0, maximum: 600 },
          investmentAmount: { type: "number", minimum: 0 },
          monthDay: { type: "integer", minimum: 1, maximum: 31 },
        },
      },
      Goal: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          category: { type: "string", example: "education" },
          subcategory: { type: "string", example: "first_child" },
          title: { type: "string", example: "Child education" },
          description: { type: "string", nullable: true },
          targetAmount: { type: "number", example: 10000000 },
          currentAmount: { type: "number", example: 0 },
          remainingYears: { type: "integer", example: 16 },
          targetYear: { type: "integer", example: 2042 },
          bornYear: { type: "integer", nullable: true, example: 2024 },
          currentAge: { type: "integer", nullable: true, example: 2 },
          targetAge: { type: "integer", nullable: true, example: 18 },
          isActive: { type: "integer", example: 1 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateGoalRequest: {
        type: "object",
        required: ["category", "subcategory", "title", "targetAmount", "remainingYears"],
        properties: {
          category: { type: "string" },
          subcategory: { type: "string" },
          title: { type: "string" },
          description: { type: "string", nullable: true },
          targetAmount: { type: "number", minimum: 0 },
          currentAmount: { type: "number", minimum: 0 },
          remainingYears: { type: "integer", minimum: 0, maximum: 80 },
          targetYear: { type: "integer" },
          bornYear: { type: "integer", nullable: true },
          currentAge: { type: "integer", nullable: true },
          targetAge: { type: "integer", nullable: true },
        },
      },
      UpdateGoalRequest: {
        type: "object",
        minProperties: 1,
        properties: {
          category: { type: "string" },
          subcategory: { type: "string" },
          title: { type: "string" },
          description: { type: "string", nullable: true },
          targetAmount: { type: "number", minimum: 0 },
          currentAmount: { type: "number", minimum: 0 },
          remainingYears: { type: "integer", minimum: 0, maximum: 80 },
          targetYear: { type: "integer" },
          bornYear: { type: "integer", nullable: true },
          currentAge: { type: "integer", nullable: true },
          targetAge: { type: "integer", nullable: true },
        },
      },
      AdvisorReport: {
        type: "object",
        required: [
          "executiveSummary",
          "summaryReport",
          "riskWarnings",
          "planOfAction",
          "immediateActions",
          "debtStrategy",
          "investmentStrategy",
          "emiTweaks",
          "assumptions",
          "disclaimer",
        ],
        properties: {
          executiveSummary: { type: "string" },
          summaryReport: {
            type: "object",
            required: ["headline", "highlights"],
            properties: {
              headline: { type: "string" },
              highlights: {
                type: "array",
                items: {
                  type: "object",
                  required: ["label", "detail"],
                  properties: {
                    label: { type: "string" },
                    detail: { type: "string" },
                  },
                },
              },
            },
          },
          riskWarnings: {
            type: "array",
            items: {
              type: "object",
              required: ["severity", "title", "detail"],
              properties: {
                severity: {
                  type: "string",
                  enum: ["high", "medium", "low"],
                },
                title: { type: "string" },
                detail: { type: "string" },
              },
            },
          },
          planOfAction: {
            type: "array",
            items: {
              type: "object",
              required: ["priority", "category", "impact", "action", "rationale", "monthlyAmount"],
              properties: {
                priority: { type: "integer" },
                category: {
                  type: "string",
                  enum: [
                    "Emergency Fund",
                    "Debt",
                    "Expenses",
                    "Savings",
                    "Investments",
                    "Insurance",
                    "Safety",
                    "Goals",
                  ],
                },
                impact: { type: "string", enum: ["High", "Medium", "Low"] },
                action: { type: "string" },
                rationale: { type: "string" },
                monthlyAmount: { type: "number", nullable: true },
              },
            },
          },
          immediateActions: {
            type: "array",
            items: {
              type: "object",
              required: ["priority", "action", "rationale", "monthlyAmount"],
              properties: {
                priority: { type: "integer" },
                action: { type: "string" },
                rationale: { type: "string" },
                monthlyAmount: { type: "number", nullable: true },
              },
            },
          },
          debtStrategy: {
            type: "object",
            required: ["summary", "steps", "expectedDebtFreeMonth"],
            properties: {
              summary: { type: "string" },
              expectedDebtFreeMonth: { type: "integer" },
              steps: {
                type: "array",
                items: {
                  type: "object",
                  required: ["order", "loan", "action", "reason"],
                  properties: {
                    order: { type: "integer" },
                    loan: { type: "string" },
                    action: { type: "string" },
                    reason: { type: "string" },
                  },
                },
              },
            },
          },
          investmentStrategy: {
            type: "object",
            required: [
              "status",
              "resumeTrigger",
              "monthlyAmountWhenResumed",
              "rationale",
            ],
            properties: {
              status: {
                type: "string",
                enum: ["continue", "pause", "resume", "review"],
              },
              resumeTrigger: { type: "string" },
              monthlyAmountWhenResumed: { type: "number", nullable: true },
              rationale: { type: "string" },
            },
          },
          emiTweaks: {
            type: "array",
            items: {
              type: "object",
              required: [
                "loan",
                "change",
                "monthlyExtra",
                "estimatedMonthsSaved",
                "estimatedInterestSaved",
                "caveat",
              ],
              properties: {
                loan: { type: "string" },
                change: { type: "string" },
                monthlyExtra: { type: "number" },
                estimatedMonthsSaved: { type: "integer", nullable: true },
                estimatedInterestSaved: { type: "number", nullable: true },
                caveat: { type: "string" },
              },
            },
          },
          assumptions: { type: "array", items: { type: "string" } },
          disclaimer: { type: "string" },
        },
      },
    },
    responses: {
      EnvelopeError: {
        description: "Request failed. Same envelope shape as success.",
        headers: {
          "x-request-id": {
            schema: { type: "string" },
            description: "Correlation ID",
          },
        },
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorEnvelope" },
          },
        },
      },
      ValidationFailed: {
        description: "Request body, query, or params failed Zod validation.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ValidationError" },
          },
        },
      },
      Unauthorized: {
        description: "Missing or invalid access token.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorEnvelope" },
            example: {
              status: false,
              data: null,
              message: "Missing access token",
              timestamp: "2026-08-20T13:00:00.000Z",
              requestId: "84cd23aa-0b1e-4f2e-b222-6dc63cf84cb8",
            },
          },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        parameters: [{ $ref: "#/components/parameters/RequestId" }],
        responses: {
          "200": {
            description: "API is up",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
                example: {
                  status: true,
                  data: { ok: true },
                  message: "API is healthy",
                  timestamp: "2026-08-20T13:00:00.000Z",
                  requestId: "84cd23aa-0b1e-4f2e-b222-6dc63cf84cb8",
                },
              },
            },
          },
        },
      },
    },
    "/api/hello": {
      get: {
        tags: ["Health"],
        summary: "Sample greeting",
        parameters: [{ $ref: "#/components/parameters/RequestId" }],
        responses: {
          "200": {
            description: "Greeting payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
                example: {
                  status: true,
                  data: { message: "Hello from the API" },
                  message: "Success",
                  timestamp: "2026-08-20T13:00:00.000Z",
                  requestId: "84cd23aa-0b1e-4f2e-b222-6dc63cf84cb8",
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a user after OTP verification",
        description:
          "Call `/api/otp/generate` with `type: register` first. This endpoint verifies that OTP, creates the user, and returns access/refresh tokens so the new account is signed in.",
        parameters: [{ $ref: "#/components/parameters/RequestId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "User created, OTP consumed, and tokens issued",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "400": { $ref: "#/components/responses/EnvelopeError" },
          "409": { $ref: "#/components/responses/EnvelopeError" },
          "422": { $ref: "#/components/responses/ValidationFailed" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        parameters: [{ $ref: "#/components/parameters/RequestId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Access and refresh tokens",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/EnvelopeError" },
          "422": { $ref: "#/components/responses/ValidationFailed" },
        },
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Rotate tokens",
        description:
          "Exchanges a valid refresh token for a new access/refresh pair. The previous refresh token is invalidated.",
        parameters: [{ $ref: "#/components/parameters/RequestId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "New token pair",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/EnvelopeError" },
          "422": { $ref: "#/components/responses/ValidationFailed" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Revoke a refresh token",
        parameters: [{ $ref: "#/components/parameters/RequestId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Session dropped",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
                example: {
                  status: true,
                  data: null,
                  message: "Logout successful",
                  timestamp: "2026-08-20T13:00:00.000Z",
                  requestId: "84cd23aa-0b1e-4f2e-b222-6dc63cf84cb8",
                },
              },
            },
          },
          "422": { $ref: "#/components/responses/ValidationFailed" },
        },
      },
    },
    "/api/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password with a forgot-password OTP",
        description:
          "Call `/api/otp/generate` (and `/api/otp/resend` if needed) with `type: forgot-password` first. This endpoint verifies that OTP and sets the new password. All refresh sessions for the user are revoked.",
        parameters: [{ $ref: "#/components/parameters/RequestId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ForgotPasswordRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Password updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "400": { $ref: "#/components/responses/EnvelopeError" },
          "422": { $ref: "#/components/responses/ValidationFailed" },
        },
      },
    },
    "/api/otp/generate": {
      post: {
        tags: ["OTP"],
        summary: "Generate an OTP",
        parameters: [{ $ref: "#/components/parameters/RequestId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/OtpRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "OTP generated. The code is included only outside production.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "422": { $ref: "#/components/responses/ValidationFailed" },
        },
      },
    },
    "/api/otp/resend": {
      post: {
        tags: ["OTP"],
        summary: "Resend an OTP",
        parameters: [{ $ref: "#/components/parameters/RequestId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/OtpRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "OTP resent",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "404": { $ref: "#/components/responses/EnvelopeError" },
          "429": { $ref: "#/components/responses/EnvelopeError" },
          "422": { $ref: "#/components/responses/ValidationFailed" },
        },
      },
    },
    "/api/otp/verify": {
      post: {
        tags: ["OTP"],
        summary: "Verify an OTP",
        parameters: [{ $ref: "#/components/parameters/RequestId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifyOtpRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "OTP verified",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "400": { $ref: "#/components/responses/EnvelopeError" },
          "422": { $ref: "#/components/responses/ValidationFailed" },
        },
      },
    },
    "/api/device/add": {
      post: {
        tags: ["Devices"],
        summary: "Register a device for the current user",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/RequestId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AddDeviceRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Device added or updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "422": { $ref: "#/components/responses/ValidationFailed" },
        },
      },
    },
    "/api/device/remove": {
      post: {
        tags: ["Devices"],
        summary: "Remove a device for the current user",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/RequestId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RemoveDeviceRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Device deactivated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/EnvelopeError" },
          "422": { $ref: "#/components/responses/ValidationFailed" },
        },
      },
    },
    "/api/users/me": {
      get: {
        tags: ["Users"],
        summary: "Get current user profile",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/RequestId" }],
        responses: {
          "200": {
            description: "Profile",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      patch: {
        tags: ["Users"],
        summary: "Update current user profile",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/RequestId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateMeRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated profile",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "422": { $ref: "#/components/responses/ValidationFailed" },
        },
      },
    },
    "/api/users/me/password": {
      post: {
        tags: ["Users"],
        summary: "Change current user password",
        description:
          "Requires the current password. The new password cannot match the current password or a recently used one. All refresh sessions are revoked after a successful change.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/RequestId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ChangePasswordRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Password changed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "400": { $ref: "#/components/responses/EnvelopeError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "422": { $ref: "#/components/responses/ValidationFailed" },
        },
      },
    },
    "/api/financial-profile": {
      get: {
        tags: ["FinancialProfile"],
        summary: "Get current user financial profile",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/RequestId" }],
        responses: {
          "200": {
            description: "Financial profile",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      put: {
        tags: ["FinancialProfile"],
        summary: "Create or update current user financial profile",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/RequestId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FinancialProfileRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Saved financial profile",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "422": { $ref: "#/components/responses/ValidationFailed" },
        },
      },
    },
    "/api/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get a user by id",
        description: "Only the authenticated user's own id is allowed.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/RequestId" },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "User record",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/EnvelopeError" },
          "404": { $ref: "#/components/responses/EnvelopeError" },
        },
      },
    },
    "/api/budgets": {
      get: {
        tags: ["Budgets"],
        summary: "List current user budgets",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/RequestId" },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 25 },
          },
          { name: "type", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Paginated budgets",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Budgets"],
        summary: "Create a budget",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/RequestId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateBudgetRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Budget created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "422": { $ref: "#/components/responses/ValidationFailed" },
        },
      },
    },
    "/api/budgets/remove": {
      post: {
        tags: ["Budgets"],
        summary: "Soft-delete a budget",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/RequestId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RemoveByIdRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Budget deactivated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/EnvelopeError" },
          "422": { $ref: "#/components/responses/ValidationFailed" },
        },
      },
    },
    "/api/budgets/{id}": {
      get: {
        tags: ["Budgets"],
        summary: "Get a budget by id",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/RequestId" },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Budget",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/EnvelopeError" },
        },
      },
      patch: {
        tags: ["Budgets"],
        summary: "Update a budget",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/RequestId" },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateBudgetRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated budget",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/EnvelopeError" },
          "422": { $ref: "#/components/responses/ValidationFailed" },
        },
      },
    },
    "/api/loans": {
      get: {
        tags: ["Loans"],
        summary: "List current user loans",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/RequestId" },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 25 },
          },
        ],
        responses: {
          "200": {
            description: "Paginated loans",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Loans"],
        summary: "Create a loan",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/RequestId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateLoanRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Loan created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "422": { $ref: "#/components/responses/ValidationFailed" },
        },
      },
    },
    "/api/loans/remove": {
      post: {
        tags: ["Loans"],
        summary: "Soft-delete a loan",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/RequestId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RemoveByIdRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Loan deactivated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/EnvelopeError" },
          "422": { $ref: "#/components/responses/ValidationFailed" },
        },
      },
    },
    "/api/loans/{id}": {
      get: {
        tags: ["Loans"],
        summary: "Get a loan by id",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/RequestId" },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Loan",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/EnvelopeError" },
        },
      },
      patch: {
        tags: ["Loans"],
        summary: "Update a loan",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/RequestId" },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateLoanRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated loan",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/EnvelopeError" },
          "422": { $ref: "#/components/responses/ValidationFailed" },
        },
      },
    },
    "/api/investments": {
      get: {
        tags: ["Investments"],
        summary: "List current user investments",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/RequestId" },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 25 },
          },
          { name: "subcategory", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Paginated investments",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Investments"],
        summary: "Create an investment",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/RequestId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateInvestmentRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Investment created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "422": { $ref: "#/components/responses/ValidationFailed" },
        },
      },
    },
    "/api/investments/remove": {
      post: {
        tags: ["Investments"],
        summary: "Soft-delete an investment",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/RequestId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RemoveByIdRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Investment deactivated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/EnvelopeError" },
          "422": { $ref: "#/components/responses/ValidationFailed" },
        },
      },
    },
    "/api/investments/{id}": {
      get: {
        tags: ["Investments"],
        summary: "Get an investment by id",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/RequestId" },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Investment",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/EnvelopeError" },
        },
      },
      patch: {
        tags: ["Investments"],
        summary: "Update an investment",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/RequestId" },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateInvestmentRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated investment",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/EnvelopeError" },
          "422": { $ref: "#/components/responses/ValidationFailed" },
        },
      },
    },
    "/api/goals": {
      get: {
        tags: ["Goals"],
        summary: "List current user goals",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/RequestId" },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 25 },
          },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "subcategory", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Paginated goals",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Goals"],
        summary: "Create a goal",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/RequestId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateGoalRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Goal created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "422": { $ref: "#/components/responses/ValidationFailed" },
        },
      },
    },
    "/api/goals/remove": {
      post: {
        tags: ["Goals"],
        summary: "Soft-delete a goal",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/RequestId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RemoveByIdRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Goal deactivated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/EnvelopeError" },
          "422": { $ref: "#/components/responses/ValidationFailed" },
        },
      },
    },
    "/api/goals/{id}": {
      get: {
        tags: ["Goals"],
        summary: "Get a goal by id",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/RequestId" },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Goal",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/EnvelopeError" },
        },
      },
      patch: {
        tags: ["Goals"],
        summary: "Update a goal",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/RequestId" },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateGoalRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated goal",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/EnvelopeError" },
          "422": { $ref: "#/components/responses/ValidationFailed" },
        },
      },
    },
    "/api/planner/report": {
      get: {
        tags: ["Planner"],
        summary: "Build a financial planner report",
        description:
          "Loads the current user's budgets, loans, investments, and goals, then returns cashflow, net worth, a liability avalanche plan, FIRE progress, and recommendations.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/RequestId" }],
        responses: {
          "200": {
            description: "Planner report",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Envelope" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/advisor/report": {
      post: {
        tags: ["Advisor"],
        summary: "Generate an AI-assisted financial advisor report",
        description:
          "Returns the Redis-cached OpenAI advisor report when the financial input hash is unchanged. Calls OpenAI only when there is no matching cache entry, the numbers have changed, or `refresh=true` is passed. Names, contact details, credentials, tokens, and record IDs are not sent to OpenAI.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/RequestId" },
          {
            name: "refresh",
            in: "query",
            required: false,
            schema: { type: "boolean" },
            description: "Force a new OpenAI generation and overwrite the saved report.",
          },
        ],
        responses: {
          "200": {
            description: "Planner calculations and validated AI advice",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/Envelope" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          required: ["planner", "advice", "source", "generatedAt"],
                          properties: {
                            planner: { type: "object" },
                            advice: {
                              $ref: "#/components/schemas/AdvisorReport",
                            },
                            source: { type: "string", enum: ["openai", "cache"] },
                            generatedAt: { type: "string", format: "date-time" },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "502": { $ref: "#/components/responses/EnvelopeError" },
          "503": { $ref: "#/components/responses/EnvelopeError" },
          "504": { $ref: "#/components/responses/EnvelopeError" },
        },
      },
    },
  },
} as const;
