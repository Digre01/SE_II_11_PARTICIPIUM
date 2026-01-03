import React, { useEffect, useMemo, useState } from 'react';
import {
    Form,
    Input,
    Button,
    Alert,
    Upload,
    UploadList,
    UploadListItem,
    Row,
    Icon,
    AvatarIcon,
    Col,
} from 'design-react-kit';
import { Link } from 'react-router';
import API, { SERVER_URL } from "../API/API.mjs";

// Local persistence helpers (Invariato)
const loadSettings = async (userId) => {
    try {
        if (!userId) return null;
        const raw = localStorage.getItem(`accountSettings:${userId}`);
        const stored = raw ? JSON.parse(raw) : {};
        let photoUrl = '';
        try {
            photoUrl = await API.fetchProfilePicture(userId);
        } catch { }
        return { ...stored, photoUrl };
    } catch {
        return null;
    }
};

const saveSettings = async (userId, formData, { emailNotifications } = {}) => {
    try {
        await API.updateAccount(userId, formData);
        let photoUrl = '';
        try {
            photoUrl = await API.fetchProfilePicture(userId);
        } catch { }
        const stored = { emailNotifications: !!emailNotifications, photoUrl: photoUrl || '' };
        localStorage.setItem(`accountSettings:${userId}`, JSON.stringify(stored));
        return { photoUrl };
    } catch {
        return {};
    }
};

// Convert File -> base64 data URL (Invariato)
const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

export default function AccountConfig({ user, loggedIn }) {
    const userId = user?.id;

    // Editable fields
    const [telegram, setTelegram] = useState(user?.telegramId ?? '');
    const [emailNotifications, setEmailNotifications] = useState(user?.emailNotifications ?? true);

    // Photo state
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');
    const [photoDataUrl, setPhotoDataUrl] = useState('');
    const [currentPhotoUrl, setCurrentPhotoUrl] = useState('');

    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [successOpen, setSuccessOpen] = useState(true);
    const [errorOpen, setErrorOpen] = useState(true);

    // Initialize (Invariato)
    useEffect(() => {
        if (!userId) return;
        setTelegram(user?.telegramId || '');
        setEmailNotifications(user?.emailNotifications ?? true);
    }, [userId, user?.telegramId, user?.emailNotifications]);

    // Load saved settings (Invariato)
    useEffect(() => {
        let ignore = false;
        (async () => {
            if (!userId) return;
            const saved = await loadSettings(userId);
            if (!saved || ignore) return;
            if (saved.photoUrl) {
                const absoluteUrl = saved.photoUrl.startsWith('http')
                    ? saved.photoUrl
                    : `${SERVER_URL}${saved.photoUrl}`;
                setCurrentPhotoUrl(absoluteUrl);
                setPhotoDataUrl('');
            }
        })();
        return () => { ignore = true; };
    }, [userId]);

    // Preview logic (Invariato)
    useEffect(() => {
        if (!photoFile) return;
        const url = URL.createObjectURL(photoFile);
        setPhotoPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [photoFile]);

    const handleFileChange = async (e) => {
        setError('');
        setErrorOpen(true);
        const files = Array.from(e.target.files || []);
        if (files.length === 0) {
            setPhotoFile(null);
            return;
        }
        const file = files[0];
        if (!file.type.startsWith('image/')) {
            setError('Only image files are allowed.');
            setPhotoFile(null);
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setError('Image must be at most 2MB.');
            setPhotoFile(null);
            return;
        }
        setPhotoFile(file);
        try {
            const dataUrl = await fileToDataUrl(file);
            setPhotoDataUrl(dataUrl);
        } catch {
            setError('Could not read the selected image.');
        }
    };

    const handleRemovePhoto = () => {
        setPhotoFile(null);
        setPhotoPreview('');
        setPhotoDataUrl('');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccess('');
        setError('');
        setSuccessOpen(true);
        setErrorOpen(true);
        try {
            const formData = new FormData();
            if (telegram.trim() !== '') formData.append('telegramId', telegram.trim());
            formData.append('emailNotifications', String(emailNotifications));
            if (photoFile) {
                formData.append('photo', photoFile);
            }
            const { photoUrl } = await saveSettings(userId, formData, { emailNotifications });
            setSuccess('Profile updated successfully.');

            if (photoUrl) {
                const absoluteUrl = photoUrl.startsWith('http') ? photoUrl : `${SERVER_URL}${photoUrl}`;
                setCurrentPhotoUrl(absoluteUrl);
            }

            setPhotoFile(null);
            setPhotoPreview('');
            setPhotoDataUrl('');
        } catch (err) {
            setError(typeof err === 'string' ? err : 'Unable to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const avatarList = useMemo(() => {
        if (!photoFile && !photoDataUrl) return [];
        const src = photoDataUrl || photoPreview;
        return src ? [{ name: 'profile-photo', size: 0, src }] : [];
    }, [photoFile, photoPreview, photoDataUrl]);

    const activePhoto = photoPreview || photoDataUrl || currentPhotoUrl;

    return (
        <div className="container mt-5">
            {/* --- AVATAR SECTION --- */}
            <div className='d-flex justify-content-center mb-4'>
                <div className="position-relative">
                    {activePhoto ? (
                        <AvatarIcon size="xxl">
                            <img alt="Profile photo preview" src={activePhoto} />
                        </AvatarIcon>
                    ) : (
                        <AvatarIcon size="xxl">
                            <Icon icon="it-user" />
                        </AvatarIcon>
                    )}
                </div>
            </div>

            <Form onSubmit={handleSave} className="mb-5">
                <Row className="gy-2">
                    <Input id="info_username" label="Username" value={user?.username ?? ''} readOnly wrapperClassName="col-12 col-md-6" />
                    <Input id="info_email" label="Email" value={user?.email ?? ''} readOnly wrapperClassName="col-12 col-md-6" />
                    <Input id="info_name" label="First name" value={user?.name ?? ''} readOnly wrapperClassName="col-12 col-md-6" />
                    <Input id="info_surname" label="Last name" value={user?.surname ?? ''} readOnly wrapperClassName="col-12 col-md-6" />
                    <Input id="info_role" label="Role" value={user?.userType ?? ''} readOnly wrapperClassName="col-12 col-md-6" />
                </Row>
                
                {/* --- UPLOAD PHOTO --- */}
                <div className="mt-4 pb-4 border-bottom">
                    <p className="fw-bold mb-2 text-primary">Change Profile Photo</p>
                    <div className="d-flex flex-column flex-md-row align-items-center gap-4">
                         <div className="flex-grow-1 w-100">
                             <Upload
                                 id="profile_photo"
                                 label="Select image (max 2MB)"
                                 accept="image/*"
                                 onChange={handleFileChange}
                                 multiple={false}
                             />
                         </div>
                    </div>
                    {avatarList.length > 0 && (
                        <div className="mt-3">
                            <UploadList previewImage tipologia="file">
                                {avatarList.map((f, idx) => (
                                    <UploadListItem
                                        key={idx}
                                        fileName={f.name}
                                        previewImage
                                        previewImageAlt={f.name}
                                        previewImageSrc={f.src}
                                        uploadStatus="success"
                                        onDispose={handleRemovePhoto}
                                    />
                                ))}
                            </UploadList>
                        </div>
                    )}
                </div>

                {/* --- SETTINGS --- */}
                <div className="mt-4">
                    <h6 className="text-uppercase text-secondary fw-bold mb-3">Settings & Notifications</h6>
                    
                    <Row className="g-4">
                        {/* Telegram */}
                        <Col xs={12} md={7} lg={8}>
                            <div className="bg-light p-3 rounded">
                                <Input
                                    id="telegram"
                                    name="telegram"
                                    label="Telegram username"
                                    placeholder="e.g. john_doe"
                                    value={telegram}
                                    onChange={(e) => setTelegram(e.target.value)}
                                    infoText="Enter your username without @"
                                    wrapperClassName="mb-0 bg-white"
                                />
                                
                                {/* Telegram Verify */}
                                {Boolean(user?.telegramId) && (
                                    <div className="d-flex align-items-start mt-3 p-3 bg-white border-start border-primary border-4 shadow-sm">
                                        <Icon icon="it-info-circle" className="text-primary me-3 flex-shrink-0" size="sm" />
                                        <div>
                                            <p className="mb-2 text-muted small lh-sm">
                                                To receive notifications you must complete verification on Telegram.
                                            </p>
                                            <Link
                                                className="fw-bold text-decoration-none d-inline-flex align-items-center"
                                                to="/verify_telegram"
                                            >
                                                <span>Go to verification</span>
                                                <Icon icon="it-arrow-right" size="xs" className="ms-1" />
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Col>

                        {/* Switches */}
                        <Col xs={12} md={5} lg={4}>
                            <div className="p-3 border rounded h-100 d-flex flex-column justify-content-center">
                                <div className="form-check form-switch">
                                    <input
                                        id="emailNotifications"
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={emailNotifications}
                                        onChange={(e) => setEmailNotifications(e.target.checked)}
                                    />
                                    <label className="form-check-label fw-bold" htmlFor="emailNotifications">
                                        Email notifications
                                    </label>
                                </div>
                                <small className="text-muted mt-2 d-block">
                                    Enable or disable receiving informational emails (this setting is saved locally only).
                                </small>
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* --- FEEDBACK MESSAGES --- */}
                <div className="mt-4">
                    {error && (
                        <Alert color="danger" isOpen={errorOpen} toggle={() => setErrorOpen(false)}>
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert color="success" isOpen={successOpen} toggle={() => setSuccessOpen(false)}>
                            {success}
                        </Alert>
                    )}
                </div>

                {/* --- FOOTER ACTIONS --- */}
                <div className="d-flex justify-content-end gap-3 mt-5 pt-3 border-top">
                    <Button
                        color="secondary"
                        outline
                        type="button"
                        className="px-4"
                        onClick={() => {
                            setTelegram(user?.telegramId || '');
                            setEmailNotifications(user?.emailNotifications ?? true);
                            setPhotoDataUrl('');
                            setPhotoPreview('');
                            setPhotoFile(null);
                            setSuccess('');
                            setError('');
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        type="submit"
                        className="px-5"
                        disabled={saving}
                    >
                        {saving ? (
                            <span><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...</span>
                        ) : 'Save changes'}
                    </Button>
                </div>
            </Form>
        </div>
    );
}