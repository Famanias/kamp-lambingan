# Implementation Plan: Simplified & Metadata-Driven Booking Form

Simplify the booking experience while preserving important reservation information. Instead of hiding the guest count, require the user to enter their expected number of guests and validate it against the selected package's maximum capacity. For fixed-duration packages, automatically calculate the check-out date while displaying it as a read-only field so users clearly understand their reservation period.

These improvements will be applied consistently to both the **Chat Widget Booking Wizard** and the **Standalone Booking Page**.

---

# User Review Required

> [!IMPORTANT]
>
> * The **Number of Guests** field will remain in both booking forms and become **required**.
>
> * The maximum number of guests will be determined by the selected package.
>
> * The UI will display a helper message such as:
>
>   ```
>   Maximum guests allowed: 20
>   ```
>
>   and prevent users from entering a value greater than the package capacity.
>
> * The package configuration will define whether a package supports multiple-day stays using metadata (e.g. `allowsMultiDay`) instead of checking the package name.
>
> * For single-night packages, the **Check-out Date** will be automatically calculated as **Check-in + 1 day** and displayed as a **read-only** field instead of a user-editable input.

---

# Proposed Changes

## 1. Package Metadata

### [MODIFY] Package Data Structure

Extend each package definition with structured metadata.

Example:

```ts
{
  name: "Family Package",
  price: 8500,
  capacity: 20,
  allowsMultiDay: false
}
```

```ts
{
  name: "Exclusive Overnight",
  price: 18000,
  capacity: 40,
  allowsMultiDay: true
}
```

The booking UI should rely on these properties instead of checking package names.

Benefits:

* Easier future package renaming.
* Cleaner business logic.
* Supports future package types without additional conditions.

---

## 2. Shared Package Helper

### [NEW] Shared Utility

Create a reusable helper that returns the complete package configuration.

Example:

```ts
getSelectedPackage(packageName, packages)
```

Returns:

```ts
{
    name,
    price,
    capacity,
    allowsMultiDay,
    ...
}
```

All booking components should use this helper instead of separate lookup functions.

---

## 3. Chat Widget Booking Wizard

### [MODIFY] `ChatWidget.tsx`

### Booking Form

Replace package-specific helper functions with the shared package helper.

When a package is selected:

* Retrieve the package metadata.
* Store the selected package object for validation.
* Update helper text and validation dynamically.

### Number of Guests

Keep the field visible.

Make it **required**.

Validation:

* Minimum: 1
* Maximum: Selected package capacity

Display helper text beneath the field.

Example:

```
Maximum guests allowed: 20
```

Prevent submission if the entered value exceeds the package capacity.

### Check-out Date

If

```text
package.allowsMultiDay === false
```

Automatically calculate:

```
checkOut = checkIn + 1 day
```

Display the calculated value as a **read-only** date field labeled:

```
Check-out Date

July 16, 2026

Automatically calculated for this package.
```

If

```text
package.allowsMultiDay === true
```

display the normal editable check-out date input.

---

## 4. Standalone Booking Form

### [MODIFY] `BookForm.tsx`

Mirror the same behavior implemented in the chat booking wizard.

### Package Selection

Retrieve the package metadata using the shared helper.

### Number of Guests

* Required.
* Maximum equals package capacity.
* Display helper text indicating the maximum allowed guests.
* Prevent invalid values before submission.

### Check-out Date

For packages that do not allow multiple-day stays:

* Automatically calculate check-out.
* Display as a read-only field.

For packages allowing multiple-day stays:

* Display the editable check-out date picker.

Maintain identical validation logic between both booking interfaces.

---

## 5. Validation

### Client-side

Validate:

* Required guest count.
* Guest count must not exceed package capacity.
* Check-in date cannot be in the past.
* For multi-day packages:

  * Check-out must be after check-in.
* For single-night packages:

  * Automatically calculate check-out.

Display clear validation messages before submission.

---

### Backend

Continue validating independently of the frontend.

Never trust client-provided values.

Verify:

* Guest count does not exceed package capacity.
* Check-out date matches package rules.
* Availability remains valid.
* Capacity calculations remain correct.

---

## 6. Knowledge Base

### [MODIFY] `knowledge-base.ts`

Update booking guidance to reflect the simplified booking flow.

Mention:

* Users provide their expected number of guests.
* The system automatically validates guest limits based on the selected package.
* Single-night packages automatically calculate the check-out date.
* Only packages configured for multiple-day stays allow manual check-out selection.

---

# Verification Plan

## Automated

Run:

```bash
npm run build
```

Verify successful compilation with no TypeScript or runtime errors.

---

## Manual Testing

### Chat Booking Wizard

* Verify the guest count field is visible and required.
* Select different packages and confirm the helper text updates with the correct maximum capacity.
* Attempt to enter more guests than allowed and verify validation prevents submission.
* Select a single-night package and verify:

  * Check-out is automatically calculated.
  * The read-only check-out field is displayed.
* Select a multi-day package and verify:

  * Editable check-out input appears.
  * Validation requires a valid date range.

---

### Standalone Booking Page

Repeat the same validation scenarios and confirm behavior matches the chat booking wizard exactly.

---

# Expected Benefits

## Improved User Experience

* Fewer unnecessary inputs.
* Clearer booking duration.
* Immediate validation feedback.
* Better understanding of package capacity.

## Improved Data Quality

* Records the actual expected number of guests instead of assuming maximum occupancy.
* Produces more accurate booking statistics and operational reports.

## Better Maintainability

* Package behavior is driven by structured metadata rather than package names.
* A shared package helper eliminates duplicate logic.
* Booking rules remain consistent across all booking interfaces.

## Future Scalability

New packages can be introduced by updating package metadata without changing booking logic, making the system easier to extend and maintain over time.
