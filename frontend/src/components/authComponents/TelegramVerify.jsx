import React, { useEffect, useState } from 'react';
import { Button, Form, Input, Alert, Card, CardBody, Badge, Icon } from 'design-react-kit';
import { Navigate, useSearchParams } from 'react-router';
import API from '../../API/API.mjs';

export default function TelegramVerify({ user, loggedIn }) {
  const [searchParams] = useSearchParams();
  const [telegram, setTelegram] = useState(user?.telegramId || '');
  const [saving, setSaving] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);

  const [generatedData, setGeneratedData] = useState(null); 
  
  const [error, setError] = useState('');
  const [errorOpen, setErrorOpen] = useState(true);

  useEffect(() => {
    const tg = searchParams.get('tg');
    if (!user?.telegramId && tg) setTelegram(tg);
  }, [searchParams, user?.telegramId]);

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  const hasSavedTelegram = Boolean(user?.telegramId);

  const handleSaveTelegram = async () => {
    setSaving(true);
    setError(''); setErrorOpen(true);
    try {
      const formData = new FormData();
      formData.append('telegramId', telegram.trim());
      await API.updateAccount(user?.id, formData);
      window.location.reload();
    } catch (err) {
      const msg = typeof err === 'string' ? err : (err?.message || 'Unable to save Telegram ID.');
      setError(msg.includes('already used') || msg.includes('unique') ? 'This Telegram username is already in use.' : msg);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateCode = async () => {
    setError(''); setErrorOpen(true);
    setLoadingCode(true);
    try {
      // Use the saved ID if available, otherwise the input value
      const targetHandle = user?.telegramId || telegram;
      const { code, expiresAt } = await API.requestTelegramCode(targetHandle.trim());
      setGeneratedData({ code, expiresAt });
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Unable to generate Telegram code.');
    } finally {
      setLoadingCode(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          
          <div className="text-center mb-5">
            <h2 className="display-4">Telegram Link</h2>
            <p className="lead text-muted">Connect your account to receive updates.</p>
          </div>

          <Card className="shadow-sm border-0">
            <CardBody className="p-4 p-md-5">
              
              {/* --- SECTION 1: TELEGRAM ID --- */}
              <div className="text-center mb-4">
                <p className="text-uppercase text-muted fw-bold small tracking-wider mb-2">
                  Telegram Username
                </p>
                
                {hasSavedTelegram ? (
                  /* Display for Saved User */
                  <div className="d-flex justify-content-center align-items-center">
                    <h3 className="text-primary mb-0 display-6 fw-bold">
                      @{user.telegramId}
                    </h3>
                    <Badge color="success" className="ms-3">Verified</Badge>
                  </div>
                ) : (
                  /* Input for New/Unsaved User */
                  <Form onSubmit={(e) => { e.preventDefault(); handleSaveTelegram(); }}>
                    <Input
                      id="telegram"
                      type="text"
                      label="Insert Username (no @)"
                      value={telegram}
                      onChange={(e) => setTelegram(e.target.value)}
                      wrapperClassName="mb-3"
                    />
                    <Button 
                      color="primary" 
                      type="submit" 
                      className="w-100" 
                      disabled={!telegram.trim() || saving}
                    >
                      {saving ? 'Saving...' : 'Save Username'}
                    </Button>
                  </Form>
                )}
              </div>

              <hr className="my-4" />

              {/* --- SECTION 2: ACTIONS --- */}
              <div className="text-center">
                <p className="mb-3">
                  {generatedData 
                    ? "Code generated successfully! Enter this in the Telegram bot:" 
                    : "Need to link a new device?"}
                </p>

                {/* If code is NOT generated yet */}
                {!generatedData && (
                  <Button 
                    color="primary" 
                    size="lg" 
                    className="w-100 py-3 fw-bold"
                    onClick={handleGenerateCode}
                    disabled={(!hasSavedTelegram && !telegram.trim()) || loadingCode}
                  >
                    {loadingCode ? (
                      <span><span className="spinner-border spinner-border-sm me-2"/>Generating...</span>
                    ) : (
                      "Generate Verification Code"
                    )}
                  </Button>
                )}

                {/* If code IS generated */}
                {generatedData && (
                  <div className="bg-light p-4 rounded-3 border border-primary mt-3 position-relative">
                    <p className="small text-muted mb-1">YOUR CODE</p>
                    <div className="display-1 font-monospace fw-bold text-primary text-break">
                      {generatedData.code}
                    </div>
                    <small className="text-danger d-block mt-2">
                        Expires at {new Date(generatedData.expiresAt).toLocaleTimeString()}
                    </small>
                    
                    <Button 
                        color="secondary" 
                        size="sm" 
                        outline 
                        className="mt-3"
                        onClick={handleGenerateCode}
                    >
                        Generate New Code
                    </Button>
                  </div>
                )}
              </div>

            </CardBody>
          </Card>

          {/* Error Alert */}
          {error && (
            <Alert color="danger" isOpen={errorOpen} toggle={() => setErrorOpen(false)} className="mt-4 shadow-sm">
              <strong>Error:</strong> {error}
            </Alert>
          )}

        </div>
      </div>
    </div>
  );
}