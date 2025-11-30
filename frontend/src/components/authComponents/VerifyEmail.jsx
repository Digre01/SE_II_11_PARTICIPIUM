import { useEffect, useState } from 'react';
import { Input, Row, Col, Button, Alert, Form } from 'design-react-kit';
import { useActionState } from 'react';
import API from '../../API/API.mjs';
import { useNavigate } from 'react-router';

function VerifyEmail({ user, onVerified }) {
  const [status, setStatus] = useState({ isVerified: false, loading: true, error: null, success: null });
  const [codeInput, setCodeInput] = useState('');
  const navigate = useNavigate();
  const [state, formAction, isPending] = useActionState(async (prev, formData) => {
    const code = formData.get('code');
    if (!code || String(code).trim() === '') {
      return { error: 'Insert the verification code.' };
    }
    try {
      const res = await API.verifyEmail(code);
      setStatus(s => ({ ...s, success: 'Email verified successfully.', error: null }));
      // refresh status
      const check = await API.checkEmailVerified();
      setStatus({ isVerified: Boolean(check.isVerified), loading: false, error: null, success: 'Email verified successfully.' });
      // notify parent to refresh current user/session so homepage sees updated verification state
      if (typeof onVerified === 'function') {
        await onVerified();
      }
    
      return { ok: true };
    } catch (err) {
      return { error: typeof err === 'string' ? err : 'Verification failed.' };
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

    // If there's no user or no id, stop loading and show an error
    if (!user || !user.id) {
      setStatus({ isVerified: false, loading: false, error: 'User not available. Please log in again.', success: null });
      return;
    }

    fetchStatus();
  }, [user, navigate]);

  // Redirect logic
  useEffect(() => {
    if (status.loading) return;
    // If success just happened, let user see the message briefly then redirect
    if (status.success) {
      const t = setTimeout(() => {
        navigate('/');
      }, 1000);
      return () => clearTimeout(t);
    }
    // If already verified without a recent success (user revisits the page), redirect immediately
    if (status.isVerified) {
      navigate('/');
    }
  }, [status.loading, status.isVerified, status.success, navigate]);


  return (
    <div className="container mt-5">
      <h2 className="mb-3">Verify your email</h2>
      {status.loading ? (
        <div>Loading...</div>
      ) : (
        <>
          
          {!status.isVerified && (
            <Form action={formAction} className="mb-4">
              <Row className="gy-3">
                <Input
                  label="Verification code"
                  name="code"
                  placeholder="Enter code"
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
              </Row>
              <Row>
                {!status.isVerified ? (
                <Alert color="warning">Your email is not verified yet. Please enter the code sent to your email.</Alert>
                ) : null}
                {state?.error && <Alert color="danger">{state.error}</Alert>}
              </Row>
              
            </Form>
          )}
          {status.success && (
            <Alert color="success" className="mt-3">{status.success}</Alert>
          )}
        </>
      )}
    </div>
  );
}

export default VerifyEmail;
