# Upload Monitoring & Alert System

## Overview
Automated monitoring system that tracks video/audio upload failures and alerts administrators via email when critical failures occur.

## Failure Points Monitored

### 1. **Network Errors**
- **What**: Connection drops, timeout errors, packet loss during upload
- **Detection**: TUS client retry exhaustion, XMLHttpRequest errors
- **Mitigation**: 50MB chunks, aggressive retry logic (up to 2min delays), resumable uploads

### 2. **Authentication Failures**
- **What**: Session expires during long uploads
- **Detection**: 401/403 responses from Supabase
- **Mitigation**: Session validation before upload starts

### 3. **Storage Quota Exceeded**
- **What**: Supabase Storage bucket reaches capacity limit
- **Detection**: Storage API errors
- **Alert**: Immediate email to admins

### 4. **Database Insertion Failures**
- **What**: File uploads successfully but DB record creation fails
- **Detection**: Supabase DB insert errors
- **Alert**: Critical - file exists but not tracked in system

### 5. **File Size Limit Exceeded**
- **What**: Files larger than 5GB attempted
- **Detection**: Pre-upload validation
- **No Alert**: Handled with user-facing toast notification

### 6. **TUS Upload Specific Errors**
- **What**: Resumable upload protocol failures, chunk errors
- **Detection**: TUS client error callbacks
- **Mitigation**: Fingerprint-based resume capability

### 7. **Timeout Errors**
- **What**: Upload exceeds 30-minute limit
- **Detection**: XMLHttpRequest timeout events
- **Alert**: Sent to admins with progress percentage

## Alert System

### Database Logging
All failures are logged to `upload_failure_logs` table:
```sql
- user_id: Who attempted the upload
- file_name: Name of failed file
- file_size_bytes: File size
- error_message: Detailed error description
- error_type: Categorized error (network_error, storage_error, etc.)
- upload_progress: How far upload got before failing
- user_agent: Browser/device info
- created_at: Timestamp
```

### Email Notifications
Sent to all admin/super_admin users when:
- Network errors occur after all retries exhausted
- Storage errors prevent upload completion
- Database insertion fails
- Timeout errors occur

Email includes:
- User details (name, email)
- File information (name, size)
- Error type and message
- Upload progress percentage
- Direct link to admin panel

### Edge Function
`send-upload-failure-alert` handles:
1. Logging failure to database
2. Fetching admin email addresses
3. Sending formatted email alert via Resend
4. Error handling for alert system itself

## Usage

### For Developers
Failure alerts are sent automatically from `VideoUploader` component:
```typescript
await supabase.functions.invoke('send-upload-failure-alert', {
  body: {
    userId, userEmail, userName,
    fileName, fileSize,
    errorMessage, errorType,
    uploadProgress, userAgent
  }
});
```

### For Admins
1. Check email for upload failure alerts
2. Review `upload_failure_logs` table in admin panel
3. Contact users if patterns emerge
4. Monitor for systemic issues (storage quota, network problems)

## Configuration

### Resend Setup
- Domain: seeksy.io (verified with SPF, DKIM, DMARC)
- Sender: hello@seeksy.io
- API Key: Stored in `RESEND_API_KEY` secret

### Alert Recipients
All users with `admin` or `super_admin` role in `user_roles` table receive alerts.

## Monitoring Best Practices

1. **Review failure logs weekly** to identify patterns
2. **Check storage quota** when storage_error alerts increase
3. **Investigate network_error clusters** - may indicate ISP issues
4. **Monitor upload success rate** - target >95%
5. **Set up database alerts** for failure log volume spikes

## Error Type Categories

| Error Type | Description | User Impact | Action Required |
|------------|-------------|-------------|-----------------|
| `network_error` | Connection issues | Upload fails, can retry | Monitor for patterns |
| `timeout_error` | Upload takes >30min | Large file fails | Consider increasing limits |
| `storage_error` | Supabase quota reached | All uploads fail | Upgrade storage plan |
| `database_error` | DB record creation fails | File lost/untracked | Manual recovery needed |
| `unknown_error` | Unclassified failure | Varies | Investigate individually |

## Future Enhancements

- [ ] In-app notification system for real-time alerts
- [ ] Admin dashboard widget showing failure metrics
- [ ] Automatic retry mechanism for certain error types
- [ ] Upload success rate tracking and reporting
- [ ] Predictive analytics for storage capacity planning
