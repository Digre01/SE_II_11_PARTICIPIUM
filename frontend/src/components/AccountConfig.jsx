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
	Col
} from 'design-react-kit';
import API from "../API/API.mjs";

// Local persistence helpers
const loadSettings = (userId) => {
	try {
		const raw = localStorage.getItem(`accountSettings:${userId}`);
		if (!raw) return null;
		return JSON.parse(raw);
	} catch {
		return null;
	}
};

const saveSettings = async (userId, settings) => {
	try {
		localStorage.setItem(`accountSettings:${userId}`, JSON.stringify(settings));
		await API.updateAccount(userId, settings);
	} catch {
		// ignore storage failures
	}
};

// Convert File -> base64 data URL
const fileToDataUrl = (file) => new Promise((resolve, reject) => {
	const reader = new FileReader();
	reader.onload = () => resolve(reader.result);
	reader.onerror = reject;
	reader.readAsDataURL(file);
});

export default function AccountConfig({ user, loggedIn }) {
	const userId = user?.id;

	const [telegram, setTelegram] = useState('');
	const [emailNotifications, setEmailNotifications] = useState(true);
	const [photoFile, setPhotoFile] = useState(null);
	const [photoPreview, setPhotoPreview] = useState('');
	const [photoDataUrl, setPhotoDataUrl] = useState('');

	const [saving, setSaving] = useState(false);
	const [success, setSuccess] = useState('');
	const [error, setError] = useState('');
	const [successOpen, setSuccessOpen] = useState(true);
	const [errorOpen, setErrorOpen] = useState(true);

	// Load saved settings at mount
	useEffect(() => {
		const saved = loadSettings(userId);
		if (saved) {
			setTelegram(saved.telegram || '');
			setEmailNotifications(Boolean(saved.emailNotifications));
			if (saved.photoDataUrl) {
				setPhotoDataUrl(saved.photoDataUrl);
				setPhotoPreview(saved.photoDataUrl);
			}
		}
	}, [userId]);

	// Keep preview URL in sync with selected file
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
			const payload = {
				telegram: telegram.trim(),
				emailNotifications,
				photoDataUrl: photoDataUrl || ''
			};
			saveSettings(userId, payload);
			setSuccess('Settings saved locally.');
		} catch (err) {
			setError('Unable to save settings.');
		} finally {
			setSaving(false);
		}
	};

	const avatarList = useMemo(() => {
		if (!photoPreview && !photoDataUrl) return [];
		const src = photoPreview || photoDataUrl;
		return [{ name: 'profile-photo', size: 0, src }];
	}, [photoPreview, photoDataUrl]);

	const telegramHelp = 'Your Telegram username (without @).';

	return (
		<div className="container mt-5">
					{(photoPreview || photoDataUrl) && (
						<div className="d-flex justify-content-center mb-3">
							<img
								src={photoPreview || photoDataUrl}
								alt="Profile photo preview"
								style={{
									width: 'clamp(96px, 35vw, 128px)',
									height: 'clamp(96px, 35vw, 128px)',
									borderRadius: '50%',
									objectFit: 'cover',
									border: '2px solid #e0e0e0'
								}}
							/>
						</div>
					)}

			<Form onSubmit={handleSave} className="mb-4">
						<Row className="gy-2">
							<Input id="info_username" label="Username" value={user?.username ?? ''} readOnly wrapperClassName="col-12 col-md-6" />
							<Input id="info_email" label="Email" value={user?.email ?? ''} readOnly wrapperClassName="col-12 col-md-6" />
							<Input id="info_name" label="Name" value={user?.name ?? ''} readOnly wrapperClassName="col-12 col-md-6" />
							<Input id="info_surname" label="Surname" value={user?.surname ?? ''} readOnly wrapperClassName="col-12 col-md-6" />
							<Input id="info_role" label="Role" value={user?.userType ?? ''} readOnly wrapperClassName="col-12 col-md-6" />
				</Row>
				<div className="form-text mt-1 mb-3">These details are read-only.</div>

				<h6 className="mb-2 mt-3">Profile</h6>
				<div className="text-center mb-3">
					<Upload
						id="profile_photo"
						label="Upload an image (max 2MB)"
						accept="image/*"
						onChange={handleFileChange}
						multiple={false}
						style={{ margin: '0 auto', display: 'inline-block' }}
					/>
				</div>
						{(avatarList.length > 0) && (
							<div className="d-flex justify-content-center mb-3 overflow-auto" style={{ maxWidth: '100%' }}>
						<UploadList previewImage tipologia="file">
							{avatarList.map((f, idx) => (
								<UploadListItem
									key={idx}
									fileName={f.name}
									fileWeight={''}
									previewImage
									previewImageAlt={f.name}
									previewImageSrc={f.src}
									uploadStatus="success"
									onDispose={() => handleRemovePhoto()}
								/>
							))}
						</UploadList>
					</div>
				)}

				<Row className="gy-2 align-items-center">
								<Input
						id="telegram"
						name="telegram"
						label="Telegram username"
						placeholder="e.g. john_doe"
						value={telegram}
						onChange={(e) => setTelegram(e.target.value)}
						infoText={telegramHelp}
									wrapperClassName="col-12 col-md-6"
					/>
					<Col className="col-12 col-md-6">
						<div className="form-check form-switch mt-3 mt-md-0">
							<input
								id="emailNotifications"
								className="form-check-input"
								type="checkbox"
								checked={emailNotifications}
								onChange={(e) => setEmailNotifications(e.target.checked)}
											aria-label="Toggle email notifications"
							/>
							<label className="form-check-label" htmlFor="emailNotifications">
								Email notifications
							</label>
							<div className="form-text">Emails are not implemented; this toggle is saved locally only.</div>
						</div>
					</Col>
				</Row>

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

				<Row className="gy-3 mt-2">
					<Col className="col-12 col-sm-auto">
						<Button
							color="primary"
							outline
							type="button"
							className="w-100 w-sm-auto"
							onClick={() => {
								const saved = loadSettings(userId) || {};
								setTelegram(saved.telegram || '');
								setEmailNotifications(Boolean(saved.emailNotifications));
								setPhotoDataUrl(saved.photoDataUrl || '');
								setPhotoPreview(saved.photoDataUrl || '');
								setPhotoFile(null);
								setSuccess('');
								setError('');
							}}
						>
							Cancel
						</Button>
					</Col>
					<Col className="col-12 col-sm-auto">
						<Button
							color="primary"
							type="submit"
							className="w-100 w-sm-auto"
							disabled={saving}
						>
							{saving ? 'Saving…' : 'Save changes'}
						</Button>
					</Col>
				</Row>
			</Form>
		</div>
	);
}

