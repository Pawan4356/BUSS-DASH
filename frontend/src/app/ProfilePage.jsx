import { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Avatar, AVATAR_PRESETS, PresetGlyph, TableSkeleton, useToast } from '../shared/components'
import { useChangePasswordMutation, useGetProfileQuery, useUpdateProfileMutation } from '../api/profileApi'
import { formatRole } from './Layout'

const AVATAR_SIZE = 256
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

const GENERAL_FIELDS = [
  { key: 'firstName', label: 'First Name', autoComplete: 'given-name' },
  { key: 'lastName', label: 'Last Name', autoComplete: 'family-name' },
  { key: 'jobTitle', label: 'Job Title', autoComplete: 'organization-title' },
  { key: 'department', label: 'Department' },
  { key: 'phone', label: 'Phone Number', type: 'tel', autoComplete: 'tel' },
  { key: 'location', label: 'Work Location' },
]

const TIMEZONES = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : []

function buildForm(profile) {
  return {
    firstName: profile.firstName ?? '',
    lastName: profile.lastName ?? '',
    jobTitle: profile.jobTitle ?? '',
    department: profile.department ?? '',
    phone: profile.phone ?? '',
    location: profile.location ?? '',
    timezone: profile.timezone ?? '',
    avatar: profile.avatar ?? null,
  }
}

/** Center-crops an image file to a square JPEG data URL, small enough to store on the account. */
function resizeToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const side = Math.min(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = AVATAR_SIZE
      canvas.height = AVATAR_SIZE
      canvas
        .getContext('2d')
        .drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Unreadable image'))
    }
    img.src = url
  })
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
}

export function ProfilePage() {
  const { push } = useToast()
  const account = useSelector((s) => s.auth.account)
  const business = useSelector((s) => s.auth.business)
  const { data: profile, isLoading } = useGetProfileQuery()
  const [updateProfile, { isLoading: saving }] = useUpdateProfileMutation()
  const [form, setForm] = useState(null)
  const fileInput = useRef(null)

  useEffect(() => {
    if (profile) setForm(buildForm(profile))
  }, [profile])

  const dirty = useMemo(
    () => Boolean(profile && form && JSON.stringify(buildForm(profile)) !== JSON.stringify(form)),
    [profile, form],
  )

  if (isLoading || !form) return <TableSkeleton rows={6} cols={2} />

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return push('Choose an image file', { tone: 'danger' })
    if (file.size > MAX_UPLOAD_BYTES) return push('Image must be under 5 MB', { tone: 'danger' })
    try {
      set('avatar', await resizeToDataUrl(file))
    } catch {
      push('Could not read that image', { tone: 'danger' })
    }
  }

  async function handleSave() {
    try {
      await updateProfile(form).unwrap()
      push('Profile updated')
    } catch (err) {
      push(err.data?.message ?? 'Could not save profile', { tone: 'danger' })
    }
  }

  const previewName = [form.firstName, form.lastName].filter(Boolean).join(' ') || account?.email
  const isUpload = form.avatar?.startsWith('data:image/')

  return (
    <div className="profile-page">
      <div className="page-header">
        <div className="profile-hero">
          <Avatar avatar={form.avatar} name={previewName} size={72} />
          <div>
            <h1 className="page-title">{previewName}</h1>
            <p className="page-subtitle">
              {[form.jobTitle, business?.name].filter(Boolean).join(' · ') || formatRole(account?.role)}
            </p>
          </div>
        </div>
        <div className="cluster">
          <button type="button" className="btn" onClick={() => setForm(buildForm(profile))} disabled={!dirty || saving}>
            Discard
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={!dirty || saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <h2 className="section-title">Avatar</h2>
      <div className="card profile-card">
        <div className="avatar-picker" role="radiogroup" aria-label="Avatar">
          {AVATAR_PRESETS.map((preset) => {
            const value = `preset:${preset.key}`
            const selected = form.avatar === value
            return (
              <button
                key={preset.key}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={preset.label}
                title={preset.label}
                className={`avatar-option${selected ? ' is-selected' : ''}`}
                onClick={() => set('avatar', value)}
              >
                <PresetGlyph preset={preset} />
              </button>
            )
          })}
        </div>
        <div className="cluster" style={{ marginTop: 16, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-sm" onClick={() => fileInput.current?.click()}>
            {isUpload ? 'Replace photo' : 'Upload photo'}
          </button>
          <button type="button" className="btn btn-sm" onClick={() => set('avatar', null)} disabled={!form.avatar}>
            Use initials
          </button>
          <span className="text-muted" style={{ fontSize: 13 }}>
            {isUpload ? 'Using your uploaded photo.' : 'PNG, JPEG or WebP, up to 5 MB — cropped to a square.'}
          </span>
          <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleUpload} />
        </div>
      </div>

      <h2 className="section-title">General</h2>
      <div className="field-grid">
        {GENERAL_FIELDS.map((field) => (
          <div className="field" key={field.key}>
            <label className="field-label" htmlFor={`profile-${field.key}`}>
              {field.label}
            </label>
            <input
              id={`profile-${field.key}`}
              className="input"
              type={field.type ?? 'text'}
              autoComplete={field.autoComplete}
              maxLength={120}
              value={form[field.key]}
              onChange={(e) => set(field.key, e.target.value)}
            />
          </div>
        ))}
        <div className="field">
          <label className="field-label" htmlFor="profile-timezone">
            Time Zone
          </label>
          <input
            id="profile-timezone"
            className="input"
            list="profile-timezones"
            placeholder={Intl.DateTimeFormat().resolvedOptions().timeZone}
            value={form.timezone}
            onChange={(e) => set('timezone', e.target.value)}
          />
          <datalist id="profile-timezones">
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz} />
            ))}
          </datalist>
        </div>
      </div>

      <h2 className="section-title">Account</h2>
      <div className="field-grid">
        <ReadOnly label="Email" value={account?.email} />
        <ReadOnly label="Role" value={formatRole(account?.role)} />
        <ReadOnly label="Business" value={business?.name} />
        <ReadOnly label="Member Since" value={formatDate(profile.memberSince)} />
      </div>

      <h2 className="section-title">Security</h2>
      <PasswordForm />
    </div>
  )
}

function ReadOnly({ label, value }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="field-static">{value || '—'}</div>
    </div>
  )
}

function PasswordForm() {
  const { push } = useToast()
  const [changePassword, { isLoading }] = useChangePasswordMutation()
  const [values, setValues] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [error, setError] = useState(null)

  function set(key, value) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (values.newPassword !== values.confirmPassword) return setError('New passwords do not match.')
    try {
      await changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword }).unwrap()
      setValues({ currentPassword: '', newPassword: '', confirmPassword: '' })
      push('Password changed')
    } catch (err) {
      setError(err.data?.message ?? 'Could not change password.')
    }
  }

  return (
    <form className="card profile-card" onSubmit={handleSubmit}>
      {error && <div className="banner banner-danger">{error}</div>}
      <div className="field-grid">
        {[
          ['currentPassword', 'Current Password', 'current-password'],
          ['newPassword', 'New Password', 'new-password'],
          ['confirmPassword', 'Confirm New Password', 'new-password'],
        ].map(([key, label, autoComplete]) => (
          <div className="field" key={key}>
            <label className="field-label" htmlFor={`pw-${key}`}>
              {label}
            </label>
            <input
              id={`pw-${key}`}
              className="input"
              type="password"
              autoComplete={autoComplete}
              minLength={key === 'currentPassword' ? undefined : 8}
              required
              value={values[key]}
              onChange={(e) => set(key, e.target.value)}
            />
          </div>
        ))}
      </div>
      <button type="submit" className="btn btn-primary" disabled={isLoading}>
        {isLoading ? 'Updating…' : 'Update password'}
      </button>
    </form>
  )
}
