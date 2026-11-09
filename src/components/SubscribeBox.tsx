import React, { useState } from 'react';
import { submitNetlifyForm } from '../lib/forms';
import './SubscribeBox.css';

type Status = 'idle' | 'sending' | 'done' | 'error';

const SubscribeBox: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('sending');
    try {
      await submitNetlifyForm('subscribe', { email });
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section className="subscribe-box" aria-labelledby="subscribe-title">
      <h2 id="subscribe-title" className="subscribe-title">[GET IT EVERY MORNING]</h2>
      <p className="subscribe-copy">
        A new briefing is published every morning around 5 AM Central. Follow it today by{' '}
        <a href="/feed.xml">RSS</a>. There is no email edition yet; leave your address and you will get one
        message when it starts. Your address is used for nothing else.
      </p>

      {status === 'done' ? (
        <p className="subscribe-done" role="status">You&apos;re on the list. Thank you.</p>
      ) : (
        <form name="subscribe" className="subscribe-form" onSubmit={handleSubmit}>
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
          <button type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? 'JOINING…' : 'JOIN THE LIST'}
          </button>
        </form>
      )}
      {status === 'error' && <p className="subscribe-error" role="alert">That didn&apos;t go through. Please try again.</p>}
    </section>
  );
};

export default SubscribeBox;
