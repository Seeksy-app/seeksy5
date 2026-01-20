# Advertiser Onboarding - Implementation Summary

## Overview
The advertiser onboarding flow has been completely updated to work with the new advertising system schema. All legacy fields have been removed and the flow now properly creates records in the correct tables.

## Changes Made

### 1. Files Modified

#### `src/pages/AdvertiserSignup.tsx`
- **Removed**: All references to legacy fields (`sponsor_name`, `sponsor_email`, `sponsor_type`)
- **Updated**: Changed `user_id` to `owner_profile_id` for schema alignment
- **Added**: Confirmation screen after successful submission
- **Integrated**: Now creates records in all three required tables:
  - `advertisers` - Main advertiser profile
  - `advertiser_preferences` - Campaign goals and target categories
  - `advertiser_team_members` - Team member invitations (optional)

#### `src/components/advertiser/AdvertiserSignupSteps.tsx`
- **Updated**: Team member roles to match new schema:
  - `owner` (replaces super_admin)
  - `ad_manager` (kept)
  - `billing` (replaces admin)
  - `viewer` (replaces creative/sales)

### 2. Database Integration

#### Step 1: Company Information
Creates record in `advertisers` table:
```sql
{
  owner_profile_id: user.id,
  company_name: string,
  contact_name: string,
  contact_email: string,
  contact_phone: string?,
  website_url: string?,
  business_description: string?,
  status: 'pending'
}
```

#### Step 2: Campaign Goals
Saves to `advertiser_preferences.objectives`:
```sql
{
  advertiser_id: advertiser.id,
  objectives: { goals: ['reach', 'signups', 'purchases', ...] }
}
```

#### Step 3: Target Categories
Saves to `advertiser_preferences.target_categories`:
```sql
{
  target_categories: ['Technology', 'Business', 'Education', ...]
}
```

#### Step 4: Team Members (Optional)
Saves to `advertiser_team_members`:
```sql
{
  advertiser_id: advertiser.id,
  profile_id: null, // Filled when invite is accepted
  role: 'owner' | 'ad_manager' | 'billing' | 'viewer'
}
```

### 3. Submission Flow

1. **Validation**: Each step validates required fields before allowing progression
2. **Data Cleaning**: All legacy fields are filtered out before submission
3. **Database Creation**: 
   - Creates `advertisers` record with `status = 'pending'`
   - Creates `advertiser_preferences` with goals and categories
   - Creates `advertiser_team_members` for each team member
   - Updates `profiles.advertiser_onboarding_completed = true`
   - Updates `profiles.is_advertiser = true`
4. **Lead Tracking**: Creates a contact record in `contacts` table for sales team
5. **Notification**: Sends notification to sales team via edge function
6. **Confirmation**: Shows success screen with next steps
7. **Redirect**: User can navigate to Advertiser Dashboard or main dashboard

### 4. User Experience

#### First-Time Flow
1. User clicks "Become an Advertiser" or visits `/advertiser/signup`
2. Completes 4-step wizard:
   - Company Information
   - Campaign Goals
   - Target Categories
   - Team Members (optional)
3. Clicks "Submit Application"
4. Sees confirmation screen: "Application Submitted!"
5. Receives email notification when account is activated
6. Can access Advertiser Dashboard once approved

#### "Experience Onboarding Again"
- Located in Advertiser sidebar navigation
- Button labeled: "Experience Onboarding"
- When clicked:
  - Sets `profiles.advertiser_onboarding_completed = false`
  - Redirects to `/advertiser/signup`
  - User can go through the entire flow again
  - Does NOT delete existing advertiser record

## How to Trigger the Onboarding

### Method 1: Direct URL
```
/advertiser/signup
```

### Method 2: From Main Navigation
1. Click "Advertiser" in main menu
2. If not onboarded yet, automatically redirected to signup

### Method 3: Reset and Re-experience
1. Navigate to Advertiser Dashboard
2. Click "Experience Onboarding" in sidebar
3. Confirm the reset dialog
4. Automatically redirected to `/advertiser/signup`

## Application Status States

### Pending
- Initial state after submission
- Shows: "Application Under Review"
- User receives email when processed
- Cannot access full advertiser features yet

### Approved
- Account is activated
- Full access to Advertiser Dashboard
- Can create campaigns, upload ads, manage billing

### Rejected
- Application not approved
- User must contact support
- Shows contact information

### Suspended
- Account temporarily disabled
- User must contact support

## Data Validation

### Required Fields
- Company Name
- Contact Name
- Contact Email
- At least 1 Campaign Goal
- At least 1 Target Category

### Optional Fields
- Contact Phone
- Website URL
- Business Description
- Team Members

## Legacy Field Cleanup

### Removed Fields
- `sponsor_name` → replaced by `company_name`
- `sponsor_email` → replaced by `contact_email`
- `sponsor_type` → removed (no longer used)
- `user_id` → replaced by `owner_profile_id`

### Cache Clearing
The system automatically detects and clears any localStorage data containing legacy fields to prevent submission errors.

## Testing Checklist

- [ ] Fresh signup flow (new user)
- [ ] Existing user signup (already has account)
- [ ] Confirmation screen displays correctly
- [ ] Email notifications sent to sales team
- [ ] Advertiser record created with correct owner_profile_id
- [ ] Preferences record created with objectives and categories
- [ ] Team members saved correctly
- [ ] Profile flags updated (is_advertiser, onboarding_completed)
- [ ] Reset onboarding works correctly
- [ ] Status screens display for pending/rejected/suspended
- [ ] Navigation after completion works

## Next Steps

1. **Email Templates**: Set up automated emails for:
   - Application received confirmation
   - Application approved notification
   - Application rejected notification

2. **Admin Approval Flow**: Build admin interface to:
   - Review pending applications
   - Approve/reject with notes
   - View applicant details

3. **Team Invitations**: Implement invitation system for:
   - Sending email invites to team members
   - Accepting invites and linking profile_id
   - Managing team member permissions

4. **Onboarding Analytics**: Track:
   - Step completion rates
   - Drop-off points
   - Time to complete
   - Approval rates
