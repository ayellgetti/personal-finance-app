const envelope = { $ref: "#/components/schemas/Envelope" };
const unauthorized = { $ref: "#/components/responses/Unauthorized" };
const forbidden = { $ref: "#/components/responses/Forbidden" };
const envelopeError = { $ref: "#/components/responses/EnvelopeError" };
const validationFailed = { $ref: "#/components/responses/ValidationFailed" };
const requestId = { $ref: "#/components/parameters/RequestId" };
const removeBody = {
  required: true,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/RemoveByIdRequest" },
    },
  },
};

const pageParam = {
  name: "page",
  in: "query" as const,
  schema: { type: "integer", minimum: 1, default: 1 },
};
const limitParam = {
  name: "limit",
  in: "query" as const,
  schema: { type: "integer", minimum: 1, maximum: 100, default: 25 },
};
const idParam = {
  name: "id",
  in: "path" as const,
  required: true,
  schema: { type: "string", format: "uuid" },
};

function jsonBody(schemaName: string) {
  return {
    required: true,
    content: {
      "application/json": {
        schema: { $ref: `#/components/schemas/${schemaName}` },
      },
    },
  };
}

function ok(description: string) {
  return {
    "200": {
      description,
      content: { "application/json": { schema: envelope } },
    },
    "401": unauthorized,
    "403": forbidden,
  };
}

function created(description: string) {
  return {
    "201": {
      description,
      content: { "application/json": { schema: envelope } },
    },
    "401": unauthorized,
    "403": forbidden,
    "422": validationFailed,
  };
}

export const crmOpenApiTags = [
  { name: "CRM", description: "Sales CRM session, dashboard, and company-wide records. RBAC is CRM-only." },
  { name: "CRM Contacts", description: "Party records (lead, client, vendor, employee)" },
  { name: "CRM Enquiries", description: "Sales cases and conversion to clients" },
  { name: "CRM Follow-ups", description: "Follow-up actions; contactId is required" },
  { name: "CRM Clients", description: "Commercial client records created on convert or manually" },
  { name: "CRM Payments", description: "Collection records (not a payment gateway)" },
  { name: "CRM Tasks", description: "Work items with kanban statuses" },
  { name: "CRM Calendar", description: "Union feed plus standalone events" },
  { name: "CRM Users", description: "Admin create and assign CRM roles" },
  { name: "CRM Roles", description: "Roles and permission catalog" },
];

export const crmOpenApiSchemas = {
  CreateCrmContactRequest: {
    type: "object",
    required: ["name", "mobile", "type"],
    properties: {
      name: { type: "string", minLength: 1, maxLength: 120 },
      mobile: { type: "string", pattern: "^\\+?[0-9]{7,15}$" },
      type: { type: "string", enum: ["lead", "client", "vendor", "employee"] },
      email: { type: "string", format: "email", nullable: true },
      companyName: { type: "string", nullable: true },
      notes: { type: "string", nullable: true },
    },
  },
  CreateCrmEnquiryRequest: {
    type: "object",
    required: ["contactId", "title", "source"],
    properties: {
      contactId: { type: "string", format: "uuid" },
      title: { type: "string" },
      source: { type: "string" },
      status: {
        type: "string",
        enum: ["new", "in_progress", "won", "lost", "on_hold"],
      },
      expectedValue: { type: "number", minimum: 0, nullable: true },
      assignedToId: { type: "string", format: "uuid", nullable: true },
      notes: { type: "string", nullable: true },
    },
  },
  ConvertCrmEnquiryRequest: {
    type: "object",
    properties: {
      billingName: { type: "string" },
    },
  },
  CreateCrmFollowUpRequest: {
    type: "object",
    required: ["contactId", "dueAt"],
    properties: {
      contactId: { type: "string", format: "uuid" },
      enquiryId: { type: "string", format: "uuid", nullable: true },
      dueAt: { type: "string", format: "date-time" },
      status: { type: "string", enum: ["pending", "completed", "cancelled"] },
      assignedToId: { type: "string", format: "uuid", nullable: true },
      notes: { type: "string", nullable: true },
    },
  },
  CreateCrmClientRequest: {
    type: "object",
    required: ["contactId", "billingName"],
    properties: {
      contactId: { type: "string", format: "uuid" },
      billingName: { type: "string" },
      status: { type: "string", enum: ["active", "inactive"] },
      gstin: { type: "string", nullable: true },
      convertedFromEnquiryId: { type: "string", format: "uuid", nullable: true },
    },
  },
  CreateCrmPaymentRequest: {
    type: "object",
    required: ["clientId", "amount", "method"],
    properties: {
      clientId: { type: "string", format: "uuid" },
      enquiryId: { type: "string", format: "uuid", nullable: true },
      amount: { type: "number", minimum: 0, exclusiveMinimum: true },
      currency: { type: "string", default: "INR" },
      method: { type: "string" },
      status: { type: "string", enum: ["pending", "paid", "failed", "refunded"] },
      paidAt: { type: "string", format: "date-time", nullable: true },
      reference: { type: "string", nullable: true },
    },
  },
  CreateCrmTaskRequest: {
    type: "object",
    required: ["title"],
    properties: {
      title: { type: "string" },
      description: { type: "string", nullable: true },
      status: { type: "string", enum: ["todo", "in_progress", "in_review", "done"] },
      assigneeId: { type: "string", format: "uuid", nullable: true },
      dueAt: { type: "string", format: "date-time", nullable: true },
      contactId: { type: "string", format: "uuid", nullable: true },
      enquiryId: { type: "string", format: "uuid", nullable: true },
    },
  },
  UpdateCrmTaskStatusRequest: {
    type: "object",
    required: ["status"],
    properties: {
      status: { type: "string", enum: ["todo", "in_progress", "in_review", "done"] },
    },
  },
  CreateCrmCalendarEventRequest: {
    type: "object",
    required: ["title", "startsAt", "endsAt"],
    properties: {
      title: { type: "string" },
      startsAt: { type: "string", format: "date-time" },
      endsAt: { type: "string", format: "date-time" },
      contactId: { type: "string", format: "uuid", nullable: true },
      enquiryId: { type: "string", format: "uuid", nullable: true },
      assigneeId: { type: "string", format: "uuid", nullable: true },
      notes: { type: "string", nullable: true },
    },
  },
  CreateCrmUserRequest: {
    type: "object",
    required: [
      "firstName",
      "lastName",
      "dob",
      "gender",
      "countryCode",
      "mobileNo",
      "email",
      "password",
      "roleIds",
    ],
    properties: {
      firstName: { type: "string" },
      lastName: { type: "string" },
      dob: { type: "string", format: "date" },
      gender: { type: "string" },
      countryCode: { type: "string", example: "+91" },
      mobileNo: { type: "string", pattern: "^\\+?[0-9]{7,15}$" },
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 8, maxLength: 72 },
      roleIds: { type: "array", items: { type: "string", format: "uuid" }, minItems: 1 },
    },
  },
  UpdateCrmUserRequest: {
    type: "object",
    minProperties: 1,
    properties: {
      firstName: { type: "string" },
      lastName: { type: "string" },
      dob: { type: "string", format: "date" },
      gender: { type: "string" },
      countryCode: { type: "string" },
      mobileNo: { type: "string" },
      email: { type: "string", format: "email" },
      roleIds: { type: "array", items: { type: "string", format: "uuid" }, minItems: 1 },
    },
  },
  UpdateCrmRoleRequest: {
    type: "object",
    required: ["permissionIds"],
    properties: {
      permissionIds: { type: "array", items: { type: "string", format: "uuid" } },
    },
  },
};

export const crmOpenApiPaths = {
  "/api/crm/me": {
    get: {
      tags: ["CRM"],
      summary: "Get current CRM session",
      description:
        "Returns the authenticated user plus CRM roles and permission codes. If Permission is empty, bootstraps the catalog and four roles. If UserRole is empty, the first caller becomes admin. Users with no CRM role receive 403 after bootstrap has already assigned an admin. Permissions are not stored in the JWT.",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      responses: {
        "200": {
          description: "CRM session",
          content: { "application/json": { schema: envelope } },
        },
        "401": unauthorized,
        "403": forbidden,
      },
    },
  },
  "/api/crm/dashboard": {
    get: {
      tags: ["CRM"],
      summary: "Dashboard analytics cards",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      responses: {
        ...ok("Dashboard snapshot"),
      },
    },
  },
  "/api/crm/contacts": {
    get: {
      tags: ["CRM Contacts"],
      summary: "List contacts",
      security: [{ bearerAuth: [] }],
      parameters: [
        requestId,
        pageParam,
        limitParam,
        {
          name: "type",
          in: "query",
          schema: { type: "string", enum: ["lead", "client", "vendor", "employee"] },
        },
        { name: "search", in: "query", schema: { type: "string" }, description: "Name or mobile" },
      ],
      responses: { ...ok("Paginated contacts") },
    },
    post: {
      tags: ["CRM Contacts"],
      summary: "Create a contact",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      requestBody: jsonBody("CreateCrmContactRequest"),
      responses: { ...created("Contact created"), "409": envelopeError },
    },
  },
  "/api/crm/contacts/remove": {
    post: {
      tags: ["CRM Contacts"],
      summary: "Soft-delete a contact",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      requestBody: removeBody,
      responses: { ...ok("Contact deactivated"), "404": envelopeError },
    },
  },
  "/api/crm/contacts/{id}": {
    get: {
      tags: ["CRM Contacts"],
      summary: "Get a contact",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      responses: { ...ok("Contact"), "404": envelopeError },
    },
    patch: {
      tags: ["CRM Contacts"],
      summary: "Update a contact",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      requestBody: jsonBody("CreateCrmContactRequest"),
      responses: {
        ...ok("Updated contact"),
        "404": envelopeError,
        "409": envelopeError,
        "422": validationFailed,
      },
    },
  },
  "/api/crm/enquiries": {
    get: {
      tags: ["CRM Enquiries"],
      summary: "List enquiries",
      security: [{ bearerAuth: [] }],
      parameters: [
        requestId,
        pageParam,
        limitParam,
        {
          name: "status",
          in: "query",
          schema: { type: "string", enum: ["new", "in_progress", "won", "lost", "on_hold"] },
        },
        { name: "contactId", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "assignedToId", in: "query", schema: { type: "string", format: "uuid" } },
      ],
      responses: { ...ok("Paginated enquiries") },
    },
    post: {
      tags: ["CRM Enquiries"],
      summary: "Create an enquiry",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      requestBody: jsonBody("CreateCrmEnquiryRequest"),
      responses: { ...created("Enquiry created"), "422": validationFailed },
    },
  },
  "/api/crm/enquiries/remove": {
    post: {
      tags: ["CRM Enquiries"],
      summary: "Soft-delete an enquiry",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      requestBody: removeBody,
      responses: { ...ok("Enquiry deactivated"), "404": envelopeError },
    },
  },
  "/api/crm/enquiries/{id}/convert": {
    post: {
      tags: ["CRM Enquiries"],
      summary: "Convert an enquiry to a client",
      description:
        "Runs in a short transaction: sets enquiry won, contact type=client, creates CrmClient if missing. Idempotent when already won and a client exists.",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      requestBody: jsonBody("ConvertCrmEnquiryRequest"),
      responses: { ...ok("Converted enquiry"), "404": envelopeError, "409": envelopeError, "422": validationFailed },
    },
  },
  "/api/crm/enquiries/{id}": {
    get: {
      tags: ["CRM Enquiries"],
      summary: "Get an enquiry",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      responses: { ...ok("Enquiry"), "404": envelopeError },
    },
    patch: {
      tags: ["CRM Enquiries"],
      summary: "Update an enquiry",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      requestBody: jsonBody("CreateCrmEnquiryRequest"),
      responses: { ...ok("Updated enquiry"), "404": envelopeError, "422": validationFailed },
    },
  },
  "/api/crm/followups": {
    get: {
      tags: ["CRM Follow-ups"],
      summary: "List follow-ups",
      security: [{ bearerAuth: [] }],
      parameters: [
        requestId,
        pageParam,
        limitParam,
        {
          name: "status",
          in: "query",
          schema: { type: "string", enum: ["pending", "completed", "cancelled"] },
        },
        { name: "enquiryId", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "contactId", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
        { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
      ],
      responses: { ...ok("Paginated follow-ups") },
    },
    post: {
      tags: ["CRM Follow-ups"],
      summary: "Create a follow-up",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      requestBody: jsonBody("CreateCrmFollowUpRequest"),
      responses: { ...created("Follow-up created") },
    },
  },
  "/api/crm/followups/remove": {
    post: {
      tags: ["CRM Follow-ups"],
      summary: "Soft-delete a follow-up",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      requestBody: removeBody,
      responses: { ...ok("Follow-up deactivated"), "404": envelopeError },
    },
  },
  "/api/crm/followups/{id}": {
    get: {
      tags: ["CRM Follow-ups"],
      summary: "Get a follow-up",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      responses: { ...ok("Follow-up"), "404": envelopeError },
    },
    patch: {
      tags: ["CRM Follow-ups"],
      summary: "Update a follow-up",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      requestBody: jsonBody("CreateCrmFollowUpRequest"),
      responses: { ...ok("Updated follow-up"), "404": envelopeError, "422": validationFailed },
    },
  },
  "/api/crm/clients": {
    get: {
      tags: ["CRM Clients"],
      summary: "List clients",
      security: [{ bearerAuth: [] }],
      parameters: [
        requestId,
        pageParam,
        limitParam,
        { name: "status", in: "query", schema: { type: "string", enum: ["active", "inactive"] } },
        { name: "search", in: "query", schema: { type: "string" } },
      ],
      responses: { ...ok("Paginated clients") },
    },
    post: {
      tags: ["CRM Clients"],
      summary: "Create a client",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      requestBody: jsonBody("CreateCrmClientRequest"),
      responses: { ...created("Client created"), "409": envelopeError },
    },
  },
  "/api/crm/clients/remove": {
    post: {
      tags: ["CRM Clients"],
      summary: "Soft-delete a client",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      requestBody: removeBody,
      responses: { ...ok("Client deactivated"), "404": envelopeError },
    },
  },
  "/api/crm/clients/{id}": {
    get: {
      tags: ["CRM Clients"],
      summary: "Get a client",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      responses: { ...ok("Client"), "404": envelopeError },
    },
    patch: {
      tags: ["CRM Clients"],
      summary: "Update a client",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      requestBody: jsonBody("CreateCrmClientRequest"),
      responses: { ...ok("Updated client"), "404": envelopeError, "422": validationFailed },
    },
  },
  "/api/crm/payments": {
    get: {
      tags: ["CRM Payments"],
      summary: "List payments",
      security: [{ bearerAuth: [] }],
      parameters: [
        requestId,
        pageParam,
        limitParam,
        { name: "clientId", in: "query", schema: { type: "string", format: "uuid" } },
        {
          name: "status",
          in: "query",
          schema: { type: "string", enum: ["pending", "paid", "failed", "refunded"] },
        },
        { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
        { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
      ],
      responses: { ...ok("Paginated payments") },
    },
    post: {
      tags: ["CRM Payments"],
      summary: "Create a payment",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      requestBody: jsonBody("CreateCrmPaymentRequest"),
      responses: { ...created("Payment created") },
    },
  },
  "/api/crm/payments/remove": {
    post: {
      tags: ["CRM Payments"],
      summary: "Soft-delete a payment",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      requestBody: removeBody,
      responses: { ...ok("Payment deactivated"), "404": envelopeError },
    },
  },
  "/api/crm/payments/{id}": {
    get: {
      tags: ["CRM Payments"],
      summary: "Get a payment",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      responses: { ...ok("Payment"), "404": envelopeError },
    },
    patch: {
      tags: ["CRM Payments"],
      summary: "Update a payment",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      requestBody: jsonBody("CreateCrmPaymentRequest"),
      responses: { ...ok("Updated payment"), "404": envelopeError, "422": validationFailed },
    },
  },
  "/api/crm/tasks": {
    get: {
      tags: ["CRM Tasks"],
      summary: "List tasks",
      security: [{ bearerAuth: [] }],
      parameters: [
        requestId,
        pageParam,
        limitParam,
        {
          name: "status",
          in: "query",
          schema: { type: "string", enum: ["todo", "in_progress", "in_review", "done"] },
        },
        { name: "assigneeId", in: "query", schema: { type: "string", format: "uuid" } },
      ],
      responses: { ...ok("Paginated tasks") },
    },
    post: {
      tags: ["CRM Tasks"],
      summary: "Create a task",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      requestBody: jsonBody("CreateCrmTaskRequest"),
      responses: { ...created("Task created") },
    },
  },
  "/api/crm/tasks/remove": {
    post: {
      tags: ["CRM Tasks"],
      summary: "Soft-delete a task",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      requestBody: removeBody,
      responses: { ...ok("Task deactivated"), "404": envelopeError },
    },
  },
  "/api/crm/tasks/{id}/status": {
    patch: {
      tags: ["CRM Tasks"],
      summary: "Update task status",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      requestBody: jsonBody("UpdateCrmTaskStatusRequest"),
      responses: { ...ok("Updated task"), "404": envelopeError, "422": validationFailed },
    },
  },
  "/api/crm/tasks/{id}": {
    get: {
      tags: ["CRM Tasks"],
      summary: "Get a task",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      responses: { ...ok("Task"), "404": envelopeError },
    },
    patch: {
      tags: ["CRM Tasks"],
      summary: "Update a task",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      requestBody: jsonBody("CreateCrmTaskRequest"),
      responses: { ...ok("Updated task"), "404": envelopeError, "422": validationFailed },
    },
  },
  "/api/crm/calendar": {
    get: {
      tags: ["CRM Calendar"],
      summary: "Calendar union feed",
      description: "Union of follow-ups, tasks with due dates, and events overlapping from/to. Range is required and max 92 days.",
      security: [{ bearerAuth: [] }],
      parameters: [
        requestId,
        { name: "from", in: "query", required: true, schema: { type: "string", format: "date-time" } },
        { name: "to", in: "query", required: true, schema: { type: "string", format: "date-time" } },
      ],
      responses: { ...ok("Calendar items"), "422": validationFailed },
    },
  },
  "/api/crm/calendar/events": {
    get: {
      tags: ["CRM Calendar"],
      summary: "List calendar events",
      security: [{ bearerAuth: [] }],
      parameters: [
        requestId,
        pageParam,
        limitParam,
        { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
        { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
        { name: "assigneeId", in: "query", schema: { type: "string", format: "uuid" } },
      ],
      responses: { ...ok("Paginated events") },
    },
    post: {
      tags: ["CRM Calendar"],
      summary: "Create a calendar event",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      requestBody: jsonBody("CreateCrmCalendarEventRequest"),
      responses: { ...created("Event created") },
    },
  },
  "/api/crm/calendar/events/remove": {
    post: {
      tags: ["CRM Calendar"],
      summary: "Soft-delete a calendar event",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      requestBody: removeBody,
      responses: { ...ok("Event deactivated"), "404": envelopeError },
    },
  },
  "/api/crm/calendar/events/{id}": {
    get: {
      tags: ["CRM Calendar"],
      summary: "Get a calendar event",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      responses: { ...ok("Event"), "404": envelopeError },
    },
    patch: {
      tags: ["CRM Calendar"],
      summary: "Update a calendar event",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      requestBody: jsonBody("CreateCrmCalendarEventRequest"),
      responses: { ...ok("Updated event"), "404": envelopeError, "422": validationFailed },
    },
  },
  "/api/crm/users": {
    get: {
      tags: ["CRM Users"],
      summary: "List CRM users",
      description: "Passwords are never returned.",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, pageParam, limitParam, { name: "search", in: "query", schema: { type: "string" } }],
      responses: { ...ok("Paginated users") },
    },
    post: {
      tags: ["CRM Users"],
      summary: "Create a CRM user",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      requestBody: jsonBody("CreateCrmUserRequest"),
      responses: { ...created("User created"), "409": envelopeError },
    },
  },
  "/api/crm/users/{id}": {
    patch: {
      tags: ["CRM Users"],
      summary: "Update a CRM user profile and roles",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      requestBody: jsonBody("UpdateCrmUserRequest"),
      responses: {
        ...ok("Updated user"),
        "404": envelopeError,
        "409": envelopeError,
        "422": validationFailed,
      },
    },
  },
  "/api/crm/roles": {
    get: {
      tags: ["CRM Roles"],
      summary: "List roles",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      responses: { ...ok("Roles") },
    },
  },
  "/api/crm/roles/{id}": {
    patch: {
      tags: ["CRM Roles"],
      summary: "Replace role permission ids",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      requestBody: jsonBody("UpdateCrmRoleRequest"),
      responses: { ...ok("Updated role"), "404": envelopeError, "422": validationFailed },
    },
  },
  "/api/crm/permissions": {
    get: {
      tags: ["CRM Roles"],
      summary: "List permissions",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      responses: { ...ok("Permissions") },
    },
  },
};
