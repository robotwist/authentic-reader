import React, { useEffect, useState } from 'react';
import { API_CONFIG } from '../config/api.config';
import { submitForm } from '../lib/forms';
import './SubscribeBox.css';

type Status = 'idle' | 'sending' | 'done' | 'error';

const SubscribeBox: React.FC = () => {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [emailEdition, setEmailEdition] = useState(false);

  useEffect(() => {
    fetch(`${API_CONFIG.BASE_URL}/api/subscribe`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setEmailEdition(Boolean(data?.emailEdition)))
      .catch(() => undefined);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('sending');
    try {
      await submitForm('subscribe', { email, website });
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That did not go through. Please try again.');
      setStatus('error');
    }
  };

  return (
    <section className="subscribe-box" aria-labelledby="subscribe-title">
      <h2 id="subscribe-title" className="subscribe-title">[GET IT EVERY MORNING]</h2>
      {emailEdition ? (
        <p className="subscribe-copy">
          Get the briefing in your inbox every morning, around 5 AM Central. You will get one confirmation email first,
          and every issue has an unsubscribe link. Your address is used for nothing else. Prefer a feed reader?{' '}
          <a href="/feed.xml">RSS</a>.
        </p>
      ) : (
        <p className="subscribe-copy">
          A new briefing is published every morning around 5 AM Central. Follow it today by{' '}
          <a href="/feed.xml">RSS</a>. There is no email edition yet; leave your address and you will get one
          message when it starts. Your address is used for nothing else.
        </p>
      )}

      {status === 'done' ? (
        <p className="subscribe-done" role="status">
          {emailEdition ? 'Check your inbox for a confirmation email to start receiving the briefing.' : 'You\u2019re on the list. Thank you.'}
        </p>
      ) : (
        <form className="subscribe-form" onSubmit={handleSubmit}>
          <label htmlFor="subscribe-email" className="visually-hidden">Email address</label>
          <input
            id="subscribe-email"
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'sending'}
          />
          <input
            className="visually-hidden"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
          <button type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? 'JOINING…' : 'JOIN THE LIST'}
          </button>
        </form>
      )}
      {status === 'error' && <p className="subscribe-error" role="alert">{error}</p>}
    </section>
  );
};

export default SubscribeBox;
