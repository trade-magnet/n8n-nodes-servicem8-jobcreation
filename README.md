# n8n-nodes-servicem8-jobcreation

A custom n8n community node for creating and updating ServiceM8 jobs with **intelligent client/contact deduplication**.

This node consolidates what would typically be a 50+ node workflow into a single, configurable node that handles:
- Client lookup and matching
- Contact deduplication
- Business vs individual classification
- Job creation with all optional features
- Job updates with badges, attachments, and notes

## Installation

### Community Node (Recommended)
1. Go to **Settings** > **Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-servicem8-jobcreation`
4. Click **Install**

### Manual Installation
```bash
npm install n8n-nodes-servicem8-jobcreation
```

## Credentials

This node requires ServiceM8 API credentials. Create a new credential of type **ServiceM8 API** with your API key.

To get your API key:
1. Log into ServiceM8
2. Go to **Settings** > **API & Webhooks**
3. Generate or copy your API key

---

## Operations

### Create Job

Creates a new ServiceM8 job with intelligent client/contact deduplication.

#### How Deduplication Works

1. **Contact Lookup**: Searches for existing contacts by email > mobile > phone (in priority order)
2. **Client Matching**: If a contact is found, checks if it belongs to a matching client
3. **Decision Matrix**: Determines whether to use an existing client or create a new one based on:
   - Name match quality (exact, partial, none)
   - Address match quality (exact, near, none)
   - Business vs individual classification

#### Required Fields

| Field | Description |
|-------|-------------|
| **First Name** | Required for individuals. Can be omitted if Business Name is provided. |
| **Email, Phone, or Mobile** | At least one contact method is required for deduplication. |

#### Contact Information

| Field | Description |
|-------|-------------|
| First Name | Contact's first name |
| Last Name | Contact's last name (optional) |
| Email | Primary lookup identifier for deduplication |
| Phone | Landline number (Australian format supported) |
| Mobile | Mobile number (Australian format supported) |

#### Business Information

| Field | Description |
|-------|-------------|
| Business Name | If provided, client is created as a business; otherwise as individual |

#### Address Fields

**Client Address** (fixedCollection):
| Field | Description |
|-------|-------------|
| Street | Street address including unit/suite |
| City | City or suburb |
| State/Province | State, province, or region |
| Postcode | Postal or ZIP code |
| Country | Country name |

**Job Address**:
| Field | Description |
|-------|-------------|
| Job Address Same as Client | Toggle to use client address for job site |
| Job Address | Separate address fields (only shown when toggle is off) |

#### Job Information

| Field | Description |
|-------|-------------|
| Job Details | Multiline job description/notes |
| Job Status | Quote, Work Order, In Progress, or Completed |

#### Optional Features

All optional features have an enable toggle. When enabled, additional configuration fields appear.

**Category Assignment**:
| Field | Description |
|-------|-------------|
| Enable Category | Toggle to enable |
| Use Dynamic Category | Toggle between dropdown or expression input |
| Category | Dropdown selection (loads from ServiceM8) |
| Category Name | Text/expression input for dynamic mode |

**Badges Assignment**:
| Field | Description |
|-------|-------------|
| Enable Badges | Toggle to enable |
| Use Dynamic Badges | Toggle between multi-select or expression input |
| Badges | Multi-select dropdown (loads from ServiceM8) |
| Badge Names | Comma-separated names for dynamic mode |

**Queue Assignment**:
| Field | Description |
|-------|-------------|
| Enable Queue | Toggle to enable |
| Use Dynamic Queue | Toggle between dropdown or expression input |
| Queue | Dropdown selection (loads from ServiceM8) |
| Queue Name | Text/expression input for dynamic mode |

**Notifications**:
| Field | Description |
|-------|-------------|
| Enable Notifications | Toggle to enable |
| Notification Recipients | Collection of recipients (see below) |

Each notification recipient has the following options:

| Field | Description |
|-------|-------------|
| Notification Type | **Email** or **SMS** |
| Email Address | Recipient email (for Email type) |
| Phone Number | Recipient phone (for SMS type) |
| Recipient Name | Name used in greeting |
| Email Format | **HTML** or **Plain Text** (for Email type) |
| Custom Subject | Toggle to use custom email subject |
| Subject | Custom subject line (supports placeholders) |
| Custom Message | Toggle to use custom message content |
| Message (HTML) | Custom HTML email body (when format is HTML) |
| Message (Text) | Custom plain text email body (when format is Text) |
| SMS Message | Custom SMS message (max 160 chars recommended) |
| Include Attachments | Toggle to attach files to email |
| Attachment Source | **All Binary Data** or **Specific Property** |
| Binary Property | Property name when using specific property |

**Message Placeholders**: Custom messages support these placeholders:
- `{{name}}` - Recipient name
- `{{jobNumber}}` - Job number (e.g., "J00123")
- `{{clientName}}` - Client/customer name
- `{{jobAddress}}` - Job site address
- `{{jobDetails}}` - Job description

**Attachments**:
| Field | Description |
|-------|-------------|
| Enable Attachments | Toggle to enable |
| Attachment Mode | "All Binary Data" (auto-upload from previous node) or "URL List" |
| URL List | Comma-separated URLs to download and attach |

**Notes**:
| Field | Description |
|-------|-------------|
| Enable Custom Note | Toggle to add a custom note |
| Custom Note Content | Note text to add to the job |

*Note: A system report note is always created with job creation details.*

#### Additional Options

| Field | Description |
|-------|-------------|
| Individual Name Format | "First Last" or "Last, First" - must match your ServiceM8 settings |
| Return Headers | Include all created record UUIDs in output |

---

### Update Job

Updates an existing ServiceM8 job with optional badges, attachments, and notes.

#### Job Selection

| Field | Description |
|-------|-------------|
| Job Selection Mode | "Select from Dropdown" or "Enter Job Number" |
| Job | Dropdown selection of recent jobs |
| Job Number | Manual entry (e.g., "J00123") |

#### Update Fields

Collection of job fields that can be updated:
- Status
- Job Description
- Job Address
- And more (based on ServiceM8 API)

#### Optional Features

**Add Badges**: Same as Create operation
**Upload Attachments**: Same as Create operation
**Add Note**: Add a note to the job

#### Additional Options

| Field | Description |
|-------|-------------|
| Return Headers | Include created record UUIDs (note, attachments) in output |

---

## Output Schema

Both operations return a **fixed schema** - all fields are always present (empty strings, false, or empty arrays when not applicable). This ensures predictable downstream processing.

### Create Job Output

```json
{
  "success": true,
  "error": "",
  "jobUuid": "abc-123-def-456",
  "jobNumber": "J00789",
  "clientUuid": "xyz-789-uvw-012",
  "action": "created_client_and_contact",
  "summary": {
    "clientCreated": true,
    "contactCreated": true,
    "categoryAssigned": true,
    "categoryName": "Plumbing",
    "categoryMissing": "",
    "badgesAssigned": ["Urgent", "VIP"],
    "badgesMissing": ["NonexistentBadge"],
    "queueAssigned": true,
    "queueName": "Today",
    "queueMissing": "",
    "notificationsSent": {
      "email": 2,
      "sms": 1
    },
    "attachmentsUploaded": ["invoice.pdf", "photo.jpg"],
    "attachmentsFailed": [],
    "noteAdded": true,
    "customNoteAdded": false
  },
  "debug": {
    "classification": "business",
    "contactLookupField": "email",
    "matchType": {
      "name": "exact",
      "address": "near"
    },
    "reason": "Exact name match with existing client",
    "clientsChecked": 45,
    "executionTimeMs": 1234
  },
  "createdRecords": {
    "clientUuid": "xyz-789-uvw-012",
    "companyContactUuid": "contact-456",
    "jobUuid": "abc-123-def-456",
    "jobContactUuid": "jc-789",
    "systemNoteUuid": "note-111",
    "customNoteUuid": "",
    "attachmentUuids": ["att-001", "att-002"]
  }
}
```

### Update Job Output

```json
{
  "success": true,
  "error": "",
  "jobUuid": "abc-123-def-456",
  "jobNumber": "J00789",
  "fieldsUpdated": ["status", "job_description"],
  "badgesAssigned": ["Priority"],
  "badgesMissing": [],
  "attachmentsUploaded": ["document.pdf"],
  "attachmentsFailed": [],
  "noteAdded": true,
  "createdRecords": {
    "noteUuid": "note-333",
    "attachmentUuids": ["att-003"]
  }
}
```

### Error Output (Continue On Fail)

When "Continue On Fail" is enabled and an error occurs:

```json
{
  "success": false,
  "error": "Job with number J99999 not found",
  "jobUuid": "",
  "jobNumber": "",
  "fieldsUpdated": [],
  "badgesAssigned": [],
  "badgesMissing": [],
  "attachmentsUploaded": [],
  "attachmentsFailed": [],
  "noteAdded": false,
  "createdRecords": {
    "noteUuid": "",
    "attachmentUuids": []
  }
}
```

---

## Error Handling

### Hard Failures (Node Stops)

| Error | Cause |
|-------|-------|
| `First Name is required (or provide a Business Name)` | No first name or business name provided |
| `At least one contact method is required` | No email, phone, or mobile provided |
| `No job selected` | Update operation with no job selected |
| `Job with UUID/number not found` | Job was deleted or doesn't exist |
| `ServiceM8 API error on {endpoint}` | API authentication, network, or server error |

### Soft Failures (Reported in Output)

These don't stop execution but are reported in the output:

| Field | Meaning |
|-------|---------|
| `categoryMissing` | Category name not found in ServiceM8 |
| `badgesMissing` | One or more badge names not found |
| `queueMissing` | Queue name not found in ServiceM8 |
| `attachmentsFailed` | Files that failed to upload |

---

## Decision Matrix

### Business Client Matching

| Name Match | Address Match | Action |
|------------|---------------|--------|
| Exact | Any | Use existing client |
| Partial | Exact/Near | Use existing client |
| Partial | None | Create new client |
| None | Any | Create new client |

### Individual Client Matching

| Name Match | Address Match | Action |
|------------|---------------|--------|
| Exact | Exact | Use existing client |
| Exact | Different | Create new (different person, same name) |
| Partial | Exact/Near | Use existing client |
| None | Any | Create new client |

---

## Australian Phone Number Support

The node automatically normalizes Australian phone numbers:

| Input | Normalized |
|-------|------------|
| `0412345678` | `0412 345 678` |
| `+61412345678` | `0412 345 678` |
| `0298765432` | `02 9876 5432` |
| `98765432` | `02 9876 5432` (if looks like landline) |

---

## Name Format Configuration

ServiceM8 can store individual client names in two formats:

| Format | Example | When to Use |
|--------|---------|-------------|
| First Last | `John Smith` | If your ServiceM8 is configured for standard format |
| Last, First | `Smith, John` | If your ServiceM8 uses inverted format (default) |

**Important**: The name format setting must match your ServiceM8 configuration for deduplication to work correctly. Check your ServiceM8 settings under **Settings** > **Account Settings** > **Name Format**.

---

## ServiceM8 API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api_1.0/companycontact.json` | GET, POST | Contact lookup/create |
| `/api_1.0/company.json` | GET, POST | Client lookup/create |
| `/api_1.0/job.json` | GET, POST | Job create/update |
| `/api_1.0/jobcontact.json` | GET, POST, DELETE | Job contact management |
| `/api_1.0/category.json` | GET | Category lookup |
| `/api_1.0/badge.json` | GET | Badge lookup |
| `/api_1.0/jobbadge.json` | POST | Apply badge to job |
| `/api_1.0/queue.json` | GET | Queue lookup |
| `/api_1.0/jobqueue.json` | POST | Assign job to queue |
| `/api_1.0/jobnote.json` | POST | Create job note |
| `/api_1.0/note.json` | POST | Create note |
| `/api_1.0/Attachment.json` | POST | Create attachment metadata |
| `/api_1.0/Attachment/{uuid}.file` | POST | Upload attachment binary |
| `/platform_service_sms` | POST | Send SMS notification |
| `/platform_service_email` | POST | Send email notification |

---

## Development

### Build

```bash
npm run build
```

### Local Testing

```bash
npm run build
npm link
# Then in your n8n custom nodes directory:
npm link n8n-nodes-servicem8-jobcreation
```

### Project Structure

```
n8n-nodes-servicem8-jobcreation/
├── credentials/
│   └── ServiceM8Api.credentials.ts
├── nodes/
│   └── ServiceM8JobCreation/
│       ├── ServiceM8JobCreation.node.ts
│       ├── servicem8.svg
│       ├── execute.ts
│       ├── types/
│       │   ├── api.ts
│       │   ├── input.ts
│       │   ├── result.ts
│       │   └── index.ts
│       ├── helpers/
│       │   ├── api.ts
│       │   ├── phoneUtils.ts
│       │   ├── addressUtils.ts
│       │   └── clientMatcher.ts
│       ├── methods/
│       │   ├── loadOptions.ts
│       │   └── index.ts
│       ├── properties/
│       │   ├── operation.ts
│       │   ├── create/
│       │   │   ├── contact.ts
│       │   │   ├── business.ts
│       │   │   ├── address.ts
│       │   │   ├── job.ts
│       │   │   ├── options/
│       │   │   │   ├── category.ts
│       │   │   │   ├── badges.ts
│       │   │   │   ├── queue.ts
│       │   │   │   ├── notifications.ts
│       │   │   │   ├── attachments.ts
│       │   │   │   ├── notes.ts
│       │   │   │   └── additionalOptions.ts
│       │   │   └── index.ts
│       │   └── update/
│       │       ├── jobSelection.ts
│       │       ├── fields.ts
│       │       ├── options.ts
│       │       └── index.ts
│       └── operations/
│           ├── create/
│           │   ├── orchestrator.ts
│           │   ├── inputProcessor.ts
│           │   ├── contactLookup.ts
│           │   ├── clientLookup.ts
│           │   ├── clientCreate.ts
│           │   ├── jobCreate.ts
│           │   ├── categoryAssign.ts
│           │   ├── queueAssign.ts
│           │   ├── notifications.ts
│           │   └── index.ts
│           ├── update/
│           │   ├── jobUpdate.ts
│           │   └── index.ts
│           └── shared/
│               ├── attachmentsUpload.ts
│               ├── badgesAssign.ts
│               ├── notesCreate.ts
│               └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## License

MIT

---

## Author

Trade Magnet - [www.trademagnet.com.au](https://www.trademagnet.com.au)

---

## Support

For issues and feature requests, please open an issue on GitHub.
