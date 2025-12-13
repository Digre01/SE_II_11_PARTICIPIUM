import React, { useEffect, useState } from 'react';
import { Button, Form, Input, Alert } from 'design-react-kit';
import { Navigate, useSearchParams } from 'react-router';
import API from '../../API/API.mjs';


export default function TelegramVerify({ user, loggedIn }) {
  const [searchParams] = useSearchParams();
  const [telegram, setTelegram] = useState(user?.telegramId || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [successOpen, setSuccessOpen] = useState(true);
  const [errorOpen, setErrorOpen] = useState(true);

  // Optional: prefill from ?tg=username
  useEffect(() => {
    const tg = searchParams.get('tg');
    if (!user?.telegramId && tg) setTelegram(tg);
  }, [searchParams, user?.telegramId]);

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  const handleSaveTelegram = async () => {
    setSaving(true);
    setError(''); setSuccess(''); setSuccessOpen(true); setErrorOpen(true);
    try {
      const formData = new FormData();
      formData.append('telegramId', telegram.trim());
      await API.updateAccount(user?.id, formData);
      setSuccess('Telegram ID saved.');
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Unable to save Telegram ID.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateCode = async () => {
    setError(''); setSuccess(''); setSuccessOpen(true); setErrorOpen(true);
    try {
      const { code, expiresAt } = await API.requestTelegramCode(telegram.trim());
      const exp = new Date(expiresAt);
      setSuccess(`Telegram verification code: ${code}. Expires at ${exp.toLocaleTimeString()}. Open Telegram and send /verify ${code} from @${telegram.trim()}.`);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Unable to generate Telegram code.');
    }
  };

  const hasSavedTelegram = Boolean(user?.telegramId);

  return (
    <div className="container mt-5" style={{ maxWidth: 720 }}>
      <h2 className="mb-3">Verify Telegram</h2>
      <p className="text-muted">This page helps you link your Telegram account and generate a verification code.</p>

      {!hasSavedTelegram && (
        <Form onSubmit={(e) => { e.preventDefault(); handleSaveTelegram(); }} className="mb-3">
          <Input
            id="telegram"
            name="telegram"
            label="Telegram username"
            placeholder="e.g. john_doe"
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            infoText="Your Telegram username (without @)."
            wrapperClassName="col-12"
          />
          <div className="d-flex gap-2">
            <Button color="primary" type="submit" disabled={!telegram.trim() || saving}>
              {saving ? 'Saving…' : 'Save Telegram ID'}
            </Button>
            <Button color="secondary" outline type="button" onClick={() => setTelegram(user?.telegramId || '')}>
              Reset
            </Button>
          </div>
        </Form>
      )}

      {(hasSavedTelegram || telegram.trim()) && (
        <div className="mt-3">
          <Button color="secondary" outline type="button" disabled={!telegram.trim()} onClick={handleGenerateCode}>
            Generate Telegram code
          </Button>
        </div>
      )}

      {error && (
        <Alert color="danger" isOpen={errorOpen} toggle={() => setErrorOpen(false)} className="mt-3">
          {error}
        </Alert>
      )}
      {success && (
        <Alert color="success" isOpen={successOpen} toggle={() => setSuccessOpen(false)} className="mt-3">
          {success}
        </Alert>
      )}
    </div>
  );
}
