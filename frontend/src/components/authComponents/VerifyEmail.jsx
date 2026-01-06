import { useEffect, useState } from 'react';
import { Input, Row, Col, Button, Alert, Form } from 'design-react-kit';
import { useActionState } from 'react';
import API from '../../API/API.mjs';
import { useNavigate } from 'react-router';

function VerifyEmail({ user, onVerified }) {
  const [status, setStatus] = useState({ isVerified: false, loading: true, error: null, success: null });
  const [codeInput, setCodeInput] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [info, setInfo] = useState(null);
  const navigate = useNavigate();
  const recipientEmail = user.email;
  const expireTime = user.expireTime;
  const getErrorMessage = (err) => {
    if (!err) return 'Verification failed.';
    if (typeof err === 'string') {
      try {
        const parsed = JSON.parse(err);
        if (parsed?.message) return parsed.message;
      } catch {}
      return err;
    }
    if (err?.message) return err.message;
    if (err?.error?.message) return err.error.message;
    if (err?.response?.data?.message) return err.response.data.message;
    return 'Verification failed.';
  };

  const [state, formAction, isPending] = useActionState(async (prev, formData) => {
    const code = formData.get('code');
    if (!code || String(code).trim() === '') {
      return { error: 'Insert the verification code.' };
    }
    try {
      await API.verifyEmail(code);

      const check = await API.checkEmailVerified();
      const verified = Boolean(check?.isVerified);
      setStatus({ isVerified: verified, loading: false, error: null, success: verified ? 'Email verified successfully.' : null });
      if (typeof onVerified === 'function') {
        await onVerified();
      }
      return { ok: true };
    } catch (err) {
      const msg = getErrorMessage(err);
      if (String(msg).toLowerCase().includes('expired')) {
        setInfo('Your verification code has expired. We sent you a new code by email.');
      }
      return { error: msg };
    }
  }, {});

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await API.checkEmailVerified();
        const isVerified = Boolean(res.isVerified);
        setStatus({ isVerified, loading: false, error: null, success: null });
      } catch (err) {
        setStatus({ isVerified: false, loading: false, error: 'Unable to check verification status.', success: null });
      }
    };


    if (!user || !user.id) {
      setStatus({ isVerified: false, loading: false, error: 'User not available. Please log in again.', success: null });
      return;
    }

    fetchStatus();
  }, [user, navigate]);

  useEffect(() => {
    if (status.loading) return;
    if (status.isVerified) {
      const t = setTimeout(() => {
        navigate('/', { replace: true });
      }, status.success ? 800 : 0);
      return () => clearTimeout(t);
    }
  }, [status.loading, status.isVerified, status.success, navigate]);


  return (
    <div className="container mt-5 pt-5" style={{ paddingTop: '96px' }}>
      <h2 className="mb-4">Verify your email</h2>
      {status.loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {!status.isVerified && (
            <>
              <Form action={formAction} className="mb-4">
                <Row className="gy-3 mt-2">
                  <Input
                    label="Verification code"
                    name="code"
                    type="text"
                    wrapperClassName="col-12 col-md-6"
                    defaultValue={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                  />
                </Row>
                <Row className="gy-2">
                  <Col sm="auto">
                    <Button color="primary" type="submit" disabled={isPending}>
                      Verify
                    </Button>
                  </Col>
                  <Col sm="auto">
                    <Button
                      color="secondary"
                      type="button"
                      disabled={resendDisabled}
                      onClick={async () => {
                        try {
                          setResendDisabled(true);
                          await API.resendVerification();
                          setInfo('A new verification code has been sent to your email.');
                        } catch (e) {
                          setInfo(getErrorMessage(e));
                          setResendDisabled(false);
                        }
                      }}
                    >
                      Resend code
                    </Button>
                  </Col>
                </Row>
              </Form>
            </>
          )}
          {status.success && (
            <Alert color="success" className="mt-3">{status.success}</Alert>
          )}
          {!status.isVerified ? (
            <Alert color="warning">Your email is not verified yet. Please enter the code sent to your email: <strong>{recipientEmail}</strong>, Check also your spam. Your code will expire in <strong>30 minutes</strong></Alert>
          ) : null}
          {info && <Alert color="info" className="mt-2">{info}</Alert>}
          {state.error && <Alert color="danger">{String(state.error)}</Alert>}
        </>
      )}
    </div>
  );
}

export default VerifyEmail;
