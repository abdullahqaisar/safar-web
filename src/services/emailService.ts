import type { EmailJSResponseStatus } from '@emailjs/browser';

let emailjsPromise: Promise<typeof import('@emailjs/browser')> | null = null;

const getEmailJS = async () => {
  if (!emailjsPromise) {
    emailjsPromise = import('@emailjs/browser');
  }
  return emailjsPromise;
};

export const initEmailJS = async () => {
  const emailjs = await getEmailJS();
  emailjs.init({
    publicKey: process.env.NEXT_PUBLIC_EMAILJS_USER_PUBLIC_KEY || '',
  });
};

export const sendContactEmail = async (
  formData: {
    name: string;
    email: string;
    subject: string;
    message: string;
  },
  templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
  serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
): Promise<EmailJSResponseStatus> => {
  if (!templateId || !serviceId) {
    throw new Error('EmailJS configuration is missing');
  }

  const templateParams = {
    from_name: formData.name,
    from_email: formData.email,
    subject: formData.subject || 'Contact Form Submission',
    message: formData.message,
  };

  const emailjs = await getEmailJS();
  return emailjs.send(serviceId, templateId, templateParams);
};
