# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-02-03

### Fixed

- **Fixed client matching when same email exists on multiple clients**
  - Now searches ALL contacts with matching email to find one on a client with matching name
  - Previously only checked the first contact returned, which could be on a different client
  - Prevents unnecessary duplicate clients when resubmitting with same name + email

### Changed

- **Updated documentation** - ServiceM8 allows duplicate client names (not unique as previously thought)

### Known Limitations

- **`is_individual` field is read-only via API** - ServiceM8 ignores this field when creating/updating clients via API. All clients created via API will have `is_individual=0` (business). This is a ServiceM8 platform limitation.

## [1.1.0] - 2026-02-02

### Fixed

- **Client matching simplified to exact name matching** (case-insensitive)
  - For individuals: exact name + matching email → use existing; name conflict → create with suffix (e.g., "John Smith 1")
  - For businesses: exact name → use existing, add contact
- **Improved error handling** - actual ServiceM8 error messages now shown (e.g., "Name must be unique")
- **Fixed `is_individual` type** - now sent as string per API documentation

## [1.0.2] - 2026-02-01

### Fixed

- Client address fields (street, city, state, postcode) now save correctly to ServiceM8
  - Fixed parsing of n8n fixedCollection data structure for address inputs

## [1.0.0] - 2026-02-01

### Added

- **Create Job** operation with intelligent client/contact deduplication
  - Automatic contact lookup by email, mobile, or phone
  - Smart client matching using name and address similarity
  - Business vs individual classification
  - Decision matrix for create vs reuse logic
- **Update Job** operation with field updates and optional features
- Australian phone number normalization (mobile and landline)
- Configurable name format support (First Last / Last, First)
- Category assignment (dropdown or dynamic expression)
- Badge assignment (multi-select or comma-separated names)
- Queue assignment (dropdown or dynamic expression)
- Email and SMS notifications with customizable templates
  - Message placeholders: {{name}}, {{jobNumber}}, {{clientName}}, {{jobAddress}}, {{jobDetails}}
- File attachment upload from binary data or URL list
- Custom and system notes on job creation
- Fixed output schema for predictable downstream processing
- Comprehensive error handling with soft and hard failures
- ServiceM8 API credentials with test endpoint validation
