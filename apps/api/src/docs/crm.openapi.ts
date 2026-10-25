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
  {
    name: "CRM Public",
    description: "Unauthenticated banquet or travel enquiry intake. Creates a lead contact and a new enquiry; does not return existing CRM records.",
  },
  { name: "CRM Follow-ups", description: "Follow-up history, next-contact calendar, and lead timeline; not added to the main calendar" },
  { name: "CRM Clients", description: "Commercial client records created on convert or manually" },
  { name: "CRM Payments", description: "Collection records (not a payment gateway)" },
  { name: "CRM Invoices", description: "Stored invoices that can be reprinted later" },
  {
    name: "CRM Communications",
    description: "Email, SMS, and in-app messages from a saved template or written at send time. Every message can be scheduled.",
  },
  { name: "CRM Notifications", description: "In-app notifications for the signed-in staff member" },
  { name: "CRM Tasks", description: "Work items with kanban statuses" },
  { name: "CRM Calendar", description: "Task due dates, booked enquiries, and standalone events. Follow-ups live under Follow-ups calendar." },
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
    required: ["contactId", "title", "source", "dueDate"],
    properties: {
      contactId: { type: "string", format: "uuid" },
      title: { type: "string" },
      source: { type: "string" },
      status: {
        type: "string",
        enum: [
          "new",
          "contacted",
          "qualified",
          "discussion",
          "quotation_sent",
          "negotiation",
          "schedule_meeting",
          "closed",
        ],
      },
      closedReason: { type: "string", nullable: true, description: "Required when status is closed. Value: 'Booked' or 'Lost: {reason}'." },
      expectedValue: { type: "number", minimum: 0, nullable: true },
      assignedToId: { type: "string", format: "uuid", nullable: true },
      notes: { type: "string", nullable: true },
      dueDate: {
        type: "string",
        format: "date-time",
        description:
          "Exact enquiry due date; must be today or in the future. Calendar shortcuts (7 days / 1 month / 3 months / 6 months) are UI-only.",
      },
    },
  },
  CreatePublicCrmEnquiryRequest: {
    oneOf: [
      { $ref: "#/components/schemas/CreatePublicBanquetEnquiryRequest" },
      { $ref: "#/components/schemas/CreatePublicTravelEnquiryRequest" },
    ],
  },
  CreatePublicBanquetEnquiryRequest: {
    type: "object",
    required: ["name", "mobile", "eventType", "eventDate", "timeSlot", "guestCount", "source"],
    properties: {
      kind: { type: "string", enum: ["banquet"], default: "banquet" },
      name: { type: "string", minLength: 1, maxLength: 120 },
      mobile: { type: "string", pattern: "^\\+?[0-9]{7,15}$" },
      eventType: { type: "string", minLength: 1, maxLength: 80 },
      eventDate: {
        type: "string",
        format: "date-time",
        description: "Event date; must be today or in the future.",
      },
      timeSlot: { type: "string", enum: ["morning", "evening", "full_day"] },
      guestCount: { type: "integer", minimum: 1, maximum: 10000 },
      source: { type: "string", minLength: 1, maxLength: 80 },
      venue: { type: "string", maxLength: 80 },
      budget: { type: "string", maxLength: 80 },
      menu: { type: "string", maxLength: 80 },
      decoration: { type: "string", maxLength: 80 },
      notes: { type: "string", maxLength: 4000 },
    },
  },
  CreatePublicTravelEnquiryRequest: {
    type: "object",
    required: ["kind", "name", "mobile", "tripType", "destination", "departureDate", "travelerCount", "source"],
    properties: {
      kind: { type: "string", enum: ["travel"] },
      name: { type: "string", minLength: 1, maxLength: 120 },
      mobile: { type: "string", pattern: "^\\+?[0-9]{7,15}$" },
      tripType: { type: "string", minLength: 1, maxLength: 80 },
      destination: { type: "string", minLength: 1, maxLength: 80 },
      departureDate: {
        type: "string",
        format: "date-time",
        description: "Trip start date; must be today or in the future.",
      },
      returnDate: {
        type: "string",
        format: "date-time",
        description: "Trip end date; must be on or after the departure date and today or in the future.",
      },
      travelerCount: { type: "integer", minimum: 1, maximum: 10000 },
      source: { type: "string", minLength: 1, maxLength: 80 },
      budget: { type: "string", maxLength: 80 },
      travelClass: { type: "string", maxLength: 80 },
      accommodation: { type: "string", maxLength: 80 },
      notes: { type: "string", maxLength: 4000 },
    },
  },
  ConvertCrmEnquiryRequest: {
    type: "object",
    properties: {
      billingName: { type: "string" },
      startsAt: {
        type: "string",
        format: "date-time",
        description: "Required on first convert. Event start datetime; must be today or in the future.",
      },
      endsAt: {
        type: "string",
        format: "date-time",
        nullable: true,
        description: "Event end datetime. Required when slot is omitted.",
      },
      slot: {
        type: "string",
        enum: ["morning", "evening", "full_day"],
        nullable: true,
        description: "Optional banquet slot. Required when endsAt is omitted. Morning 08:00–16:00 IST, evening 16:00–23:00 IST, full day 08:00–23:00 IST.",
      },
    },
  },
  CreateCrmFollowUpRequest: {
    type: "object",
    required: ["enquiryId", "stage", "dueAt", "nextFollowupDate"],
    properties: {
      enquiryId: { type: "string", format: "uuid" },
      stage: {
        type: "string",
        enum: [
          "new",
          "contacted",
          "qualified",
          "discussion",
          "quotation_sent",
          "negotiation",
          "schedule_meeting",
          "closed",
        ],
      },
      dueAt: { type: "string", format: "date-time" },
      nextFollowupDate: { type: "string", format: "date-time" },
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
  ImportCrmContactsRequest: {
    type: "object",
    description: "Send parsed rows or raw CSV text. Columns are name, mobile, and type (lead, client, vendor, or employee). Duplicate and invalid rows are skipped.",
    properties: {
      rows: {
        type: "array",
        maxItems: 500,
        items: {
          type: "object",
          required: ["name", "mobile", "type"],
          properties: {
            name: { type: "string" },
            mobile: { type: "string" },
            type: { type: "string" },
          },
        },
      },
      csv: { type: "string", description: "CSV text with a header row: name, mobile, type" },
    },
  },
  CreateCrmInvoiceRequest: {
    type: "object",
    required: ["contactId", "lines"],
    properties: {
      contactId: { type: "string", format: "uuid" },
      status: { type: "string", enum: ["draft", "issued", "paid", "cancelled"] },
      issuedAt: { type: "string", format: "date-time" },
      dueAt: { type: "string", format: "date-time", nullable: true },
      currency: { type: "string", default: "INR" },
      notes: { type: "string", nullable: true },
      taxPercent: { type: "number", minimum: 0, maximum: 100 },
      lines: {
        type: "array",
        minItems: 1,
        maxItems: 40,
        items: {
          type: "object",
          required: ["description", "quantity", "unitPrice"],
          properties: {
            description: { type: "string" },
            quantity: { type: "number", exclusiveMinimum: 0 },
            unitPrice: { type: "number", minimum: 0 },
          },
        },
      },
    },
  },
  CreateCrmMessageTemplateRequest: {
    type: "object",
    required: ["name", "channel", "body"],
    properties: {
      name: { type: "string" },
      channel: { type: "string", enum: ["email", "sms", "in_app"] },
      subject: { type: "string", nullable: true, description: "Required for email and in-app. Omit for SMS." },
      body: { type: "string", description: "Supports {{name}} style placeholders." },
    },
  },
  CreateCrmMessageRequest: {
    type: "object",
    required: ["channel"],
    properties: {
      channel: { type: "string", enum: ["email", "sms", "in_app"] },
      templateId: { type: "string", format: "uuid", description: "Saved template. Omit to write the message now." },
      subject: { type: "string", description: "Required for on-the-fly email and in-app messages." },
      body: { type: "string", description: "Required when templateId is omitted." },
      contactId: { type: "string", format: "uuid" },
      recipientUserId: { type: "string", format: "uuid", description: "Required for in-app. Must be CRM staff." },
      toAddress: { type: "string", description: "Email or mobile. Defaults to the contact or staff address." },
      variables: { type: "object", additionalProperties: { type: "string" } },
      scheduledAt: { type: "string", format: "date-time", description: "Omit or pass the current time to send immediately." },
    },
  },
  UpdateCrmMessageRequest: {
    type: "object",
    properties: {
      subject: { type: "string", nullable: true },
      body: { type: "string" },
      toAddress: { type: "string" },
      variables: { type: "object", additionalProperties: { type: "string" } },
      scheduledAt: { type: "string", format: "date-time" },
    },
  },
  CreateCrmPaymentRequest: {
    type: "object",
    description: "referenceType selects the payee kind; referenceId is that CrmClient's id (referenceType = client) or CrmContact's id (referenceType = vendor).",
    required: ["referenceType", "referenceId", "amount", "mode"],
    properties: {
      referenceType: { type: "string", enum: ["client", "vendor"] },
      referenceId: { type: "string", format: "uuid" },
      enquiryId: { type: "string", format: "uuid", nullable: true },
      bookingId: {
        type: "string",
        format: "uuid",
        nullable: true,
        description: "Calendar event for this client booking. Totals for one booking sum payments with this id. Omit for a vendor payment.",
      },
      amount: { type: "number", minimum: 0, exclusiveMinimum: true },
      currency: { type: "string", default: "INR" },
      type: { type: "string", enum: ["INCOME", "EXPENSE"], default: "INCOME" },
      mode: { type: "string", enum: ["CASH", "UPI", "CARD", "BANK_TRANSFER", "CHEQUE"] },
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
      slot: { type: "string", enum: ["morning", "evening", "full_day"], nullable: true },
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
  ResetCrmUserPasswordRequest: {
    type: "object",
    required: ["password"],
    properties: {
      password: { type: "string", minLength: 8, maxLength: 72 },
    },
  },
  CreateCrmRoleRequest: {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string", minLength: 2, maxLength: 80 },
      permissionIds: { type: "array", items: { type: "string", format: "uuid" } },
    },
  },
  UpdateCrmRoleRequest: {
    type: "object",
    minProperties: 1,
    properties: {
      name: { type: "string", minLength: 2, maxLength: 80 },
      permissionIds: { type: "array", items: { type: "string", format: "uuid" } },
    },
  },
};

export const crmOpenApiPaths = {
  "/api/crm/public/enquiries": {
    post: {
      tags: ["CRM Public"],
      summary: "Submit a public banquet or travel enquiry",
      description:
        "No JWT. `kind` selects banquet (default) or travel. Creates a lead contact when the mobile is new, or attaches a new enquiry to the existing active contact. Trip or event details and notes are stored on the enquiry. Response is only `{ submitted: true }` so existing CRM data is not leaked.",
      security: [],
      parameters: [requestId],
      requestBody: jsonBody("CreatePublicCrmEnquiryRequest"),
      responses: {
        "201": {
          description: "Enquiry submitted",
          content: { "application/json": { schema: envelope } },
        },
        "422": validationFailed,
      },
    },
  },
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
      description:
        "Includes leads generated today, customer due dates, overdue follow-ups (nextFollowupDate past and enquiry not closed), follow-ups for today (open enquiries with nextFollowupDate on the current calendar day), open versus closed enquiries, and paid income versus expense this month.",
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
  "/api/crm/contacts/import": {
    post: {
      tags: ["CRM Contacts"],
      summary: "Import contacts from name, mobile, and type",
      description:
        "Accepts JSON rows or CSV text. Existing mobiles and invalid rows are skipped. Created contacts store only name, mobile, and type.",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      requestBody: jsonBody("ImportCrmContactsRequest"),
      responses: { ...ok("Import result with created contacts and skipped rows"), "422": validationFailed },
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
      summary: "Get a contact with enquiries, follow-ups, and payments",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      responses: { ...ok("Contact, related enquiries (with follow-ups), and payments"), "404": envelopeError },
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
          description: "A pipeline stage, or open for every enquiry that is not closed.",
          schema: {
            type: "string",
            enum: [
              "open",
              "new",
              "contacted",
              "qualified",
              "discussion",
              "quotation_sent",
              "negotiation",
              "schedule_meeting",
              "closed",
            ],
          },
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
      description:
        "Also soft-deletes the booking event linked to the enquiry, so no orphan booking is left behind. A closed booked enquiry cannot be removed after a paid payment exists for its linked booking.",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      requestBody: removeBody,
      responses: { ...ok("Enquiry deactivated"), "404": envelopeError, "409": envelopeError },
    },
  },
  "/api/crm/enquiries/{id}/convert": {
    post: {
      tags: ["CRM Enquiries"],
      summary: "Convert an enquiry to a client",
      description:
        "Runs in a short transaction: sets enquiry closed (Booked), contact type=client, creates CrmClient if missing, and creates a calendar event linked to the enquiry. The booking notes are seeded from the enquiry's latest follow-up note, falling back to the enquiry notes; edit them later through PATCH /api/crm/calendar/events/{id}. First convert requires startsAt (today or later) and either endsAt or slot (morning / evening / full_day). Idempotent when already closed, a client exists, and a booking event is present.",
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
        { name: "enquiryId", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "contactId", in: "query", schema: { type: "string", format: "uuid" } },
        {
          name: "stage",
          in: "query",
          schema: {
            type: "string",
            enum: [
              "new",
              "contacted",
              "qualified",
              "discussion",
              "quotation_sent",
              "negotiation",
              "schedule_meeting",
              "closed",
            ],
          },
        },
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
  "/api/crm/followups/calendar": {
    get: {
      tags: ["CRM Follow-ups"],
      summary: "Follow-up calendar feed",
      description:
        "Counts new enquiries (customer due date) and follow-ups (nextFollowupDate) in the range. Overdue items are open enquiries whose nextFollowupDate has passed. Follow-ups are not added to /api/crm/calendar.",
      security: [{ bearerAuth: [] }],
      parameters: [
        requestId,
        { name: "from", in: "query", required: true, schema: { type: "string", format: "date-time" } },
        { name: "to", in: "query", required: true, schema: { type: "string", format: "date-time" } },
      ],
      responses: { ...ok("Follow-up calendar") },
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
        { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
        { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
      ],
      responses: { ...ok("Paginated clients with current booking startsAt and endsAt") },
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
        { name: "referenceType", in: "query", schema: { type: "string", enum: ["client", "vendor"] } },
        { name: "referenceId", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "bookingId", in: "query", schema: { type: "string", format: "uuid" }, description: "Payments for one booking. Results are ordered by paid date, newest first." },
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
  "/api/crm/invoices": {
    get: {
      tags: ["CRM Invoices"],
      summary: "List stored invoices",
      security: [{ bearerAuth: [] }],
      parameters: [
        requestId,
        pageParam,
        limitParam,
        {
          name: "status",
          in: "query",
          schema: { type: "string", enum: ["draft", "issued", "paid", "cancelled"] },
        },
        { name: "contactId", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "search", in: "query", schema: { type: "string" }, description: "Invoice number, bill-to name, or mobile" },
      ],
      responses: { ...ok("Paginated invoices") },
    },
    post: {
      tags: ["CRM Invoices"],
      summary: "Create and store an invoice",
      description: "Stores the bill-to name and mobile, line amounts, tax, and total so the same document can be printed later.",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      requestBody: jsonBody("CreateCrmInvoiceRequest"),
      responses: { ...created("Invoice created"), "404": envelopeError },
    },
  },
  "/api/crm/invoices/remove": {
    post: {
      tags: ["CRM Invoices"],
      summary: "Soft-delete an invoice",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      requestBody: removeBody,
      responses: { ...ok("Invoice deactivated"), "404": envelopeError },
    },
  },
  "/api/crm/invoices/{id}": {
    get: {
      tags: ["CRM Invoices"],
      summary: "Get a stored invoice with its lines",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      responses: { ...ok("Invoice and lines"), "404": envelopeError },
    },
    patch: {
      tags: ["CRM Invoices"],
      summary: "Update a stored invoice",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      requestBody: jsonBody("CreateCrmInvoiceRequest"),
      responses: { ...ok("Updated invoice"), "404": envelopeError, "422": validationFailed },
    },
  },
  "/api/crm/communications/templates": {
    get: {
      tags: ["CRM Communications"],
      summary: "List message templates",
      security: [{ bearerAuth: [] }],
      parameters: [
        requestId,
        pageParam,
        limitParam,
        { name: "channel", in: "query", schema: { type: "string", enum: ["email", "sms", "in_app"] } },
        { name: "search", in: "query", schema: { type: "string" } },
      ],
      responses: { ...ok("Paginated templates") },
    },
    post: {
      tags: ["CRM Communications"],
      summary: "Create a message template",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      requestBody: jsonBody("CreateCrmMessageTemplateRequest"),
      responses: { ...created("Template created"), "409": envelopeError },
    },
  },
  "/api/crm/communications/templates/remove": {
    post: {
      tags: ["CRM Communications"],
      summary: "Soft-delete a message template",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      requestBody: removeBody,
      responses: { ...ok("Template removed"), "404": envelopeError },
    },
  },
  "/api/crm/communications/templates/{id}": {
    get: {
      tags: ["CRM Communications"],
      summary: "Get a message template",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      responses: { ...ok("Template"), "404": envelopeError },
    },
    patch: {
      tags: ["CRM Communications"],
      summary: "Update a message template",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      requestBody: jsonBody("CreateCrmMessageTemplateRequest"),
      responses: { ...ok("Updated template"), "404": envelopeError, "409": envelopeError, "422": validationFailed },
    },
  },
  "/api/crm/communications/recipients": {
    get: {
      tags: ["CRM Communications"],
      summary: "List CRM staff who can receive an in-app notification",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      responses: { ...ok("Staff recipients") },
    },
  },
  "/api/crm/communications/messages": {
    get: {
      tags: ["CRM Communications"],
      summary: "List outbound messages",
      security: [{ bearerAuth: [] }],
      parameters: [
        requestId,
        pageParam,
        limitParam,
        { name: "channel", in: "query", schema: { type: "string", enum: ["email", "sms", "in_app"] } },
        { name: "status", in: "query", schema: { type: "string", enum: ["scheduled", "sending", "sent", "failed", "cancelled"] } },
        { name: "contactId", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "search", in: "query", schema: { type: "string" } },
      ],
      responses: { ...ok("Paginated messages") },
    },
    post: {
      tags: ["CRM Communications"],
      summary: "Send or schedule a message",
      description: "Use templateId for a saved template, or subject and body for a one-off message. Placeholders such as {{name}} are filled from the contact and variables. Omit scheduledAt to send now.",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      requestBody: jsonBody("CreateCrmMessageRequest"),
      responses: { ...created("Message saved"), "400": envelopeError },
    },
  },
  "/api/crm/communications/messages/remove": {
    post: {
      tags: ["CRM Communications"],
      summary: "Soft-delete a message",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      requestBody: removeBody,
      responses: { ...ok("Message removed"), "404": envelopeError, "409": envelopeError },
    },
  },
  "/api/crm/communications/messages/{id}/cancel": {
    post: {
      tags: ["CRM Communications"],
      summary: "Cancel a scheduled message",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      responses: { ...ok("Message cancelled"), "404": envelopeError, "409": envelopeError },
    },
  },
  "/api/crm/communications/messages/{id}": {
    get: {
      tags: ["CRM Communications"],
      summary: "Get a message",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      responses: { ...ok("Message"), "404": envelopeError },
    },
    patch: {
      tags: ["CRM Communications"],
      summary: "Change a message that is still scheduled",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      requestBody: jsonBody("UpdateCrmMessageRequest"),
      responses: { ...ok("Updated message"), "404": envelopeError, "409": envelopeError, "422": validationFailed },
    },
  },
  "/api/crm/notifications": {
    get: {
      tags: ["CRM Notifications"],
      summary: "List the signed-in user's in-app notifications",
      description: "Any CRM staff member can read their own inbox. unread=1 returns only unread rows.",
      security: [{ bearerAuth: [] }],
      parameters: [
        requestId,
        pageParam,
        limitParam,
        { name: "unread", in: "query", schema: { type: "string", enum: ["0", "1"] } },
      ],
      responses: { ...ok("Paginated notifications"), "403": forbidden },
    },
  },
  "/api/crm/notifications/{id}/read": {
    post: {
      tags: ["CRM Notifications"],
      summary: "Mark an in-app notification read",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      responses: { ...ok("Notification marked read"), "404": envelopeError },
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
      description: "Union of tasks with due dates, scheduled follow-ups of open enquiries (`kind=followup`, dated by `nextFollowupDate`), booked enquiry events (`kind=booking`), and standalone events (`kind=event`) overlapping from/to. Range is required and max 92 days.",
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
        { name: "contactId", in: "query", schema: { type: "string", format: "uuid" } },
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
      description:
        "When the event is a booking (linked to an enquiry), the linked enquiry is soft-deleted with it and the removed `enquiryId` is returned. A booking whose enquiry has a paid payment cannot be removed.",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      requestBody: removeBody,
      responses: { ...ok("Event deactivated"), "404": envelopeError, "409": envelopeError },
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
  "/api/crm/users/{id}/password": {
    post: {
      tags: ["CRM Users"],
      summary: "Reset a CRM user's password",
      description:
        "Requires crm.users.update. The new password cannot match the current password or a recently used one. All refresh sessions for that user are revoked. The password is never returned.",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      requestBody: jsonBody("ResetCrmUserPasswordRequest"),
      responses: {
        ...ok("Password reset"),
        "400": envelopeError,
        "404": envelopeError,
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
    post: {
      tags: ["CRM Roles"],
      summary: "Create a role",
      description:
        "Creates a role whose slug is derived from the name. Requires crm.roles.update. Permission descriptions come from GET /api/crm/permissions.",
      security: [{ bearerAuth: [] }],
      parameters: [requestId],
      requestBody: jsonBody("CreateCrmRoleRequest"),
      responses: { ...created("Role created"), "409": envelopeError, "422": validationFailed },
    },
  },
  "/api/crm/roles/{id}": {
    patch: {
      tags: ["CRM Roles"],
      summary: "Update a role name and/or permission ids",
      security: [{ bearerAuth: [] }],
      parameters: [requestId, idParam],
      requestBody: jsonBody("UpdateCrmRoleRequest"),
      responses: { ...ok("Updated role"), "404": envelopeError, "409": envelopeError, "422": validationFailed },
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
