import React, { useState } from 'react';
import { Mail, MapPin, Phone, Send, CheckCircle, XCircle } from 'lucide-react';

type FormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message
        })
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to send message');
      }
      
      setSubmitStatus({
        success: true,
        message: 'Your message has been sent successfully! We\'ll get back to you soon.'
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      const errorMessage = error instanceof Error ? 
        error.message : 
        'Failed to send message. Please try again later or contact us directly at dheerajgaur.0fficial@gmail.com';
      
      setSubmitStatus({
        success: false,
        message: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-4 sm:py-6 px-3 sm:px-4 lg:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 bg-clip-text text-transparent mb-3 sm:mb-4">
            Contact Us
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed px-3">
            Have questions or feedback? We'd love to hear from you!
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
          {/* Contact Information */}
          <div className="order-2 xl:order-1">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Get in Touch</h2>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start p-3 sm:p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 group">
                <div className="text-blue-600 mr-3 mt-1 flex-shrink-0 group-hover:text-blue-700 transition-colors duration-300">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-300">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 sm:mb-2">Our Office</h3>
                  <div className="space-y-1 text-gray-600 mb-2 text-xs sm:text-sm">
                    <p className="font-medium">NH-2 Delhi-Agra</p>
                    <p className="font-medium">GLA University, Mathura 281406</p>
                    <p className="font-medium">Uttar Pradesh, India</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start p-3 sm:p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 group">
                <div className="text-blue-600 mr-3 mt-1 flex-shrink-0 group-hover:text-blue-700 transition-colors duration-300">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-300">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 sm:mb-2">Email Us</h3>
                  <a 
                    href="mailto:hello@algobucks.com" 
                    className="text-blue-600 hover:text-blue-700 transition-colors text-xs sm:text-sm font-semibold hover:underline break-all"
                  >
                    hello@algobucks.com
                  </a>
                  <p className="text-gray-500 text-xs mt-1 font-medium">
                    We typically respond within 24 hours
                  </p>
                </div>
              </div>

              <div className="flex items-start p-3 sm:p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 group">
                <div className="text-blue-600 mr-3 mt-1 flex-shrink-0 group-hover:text-blue-700 transition-colors duration-300">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-300">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 sm:mb-2">Call Us</h3>
                  <a 
                    href="tel:+916397684456" 
                    className="text-blue-600 hover:text-blue-700 transition-colors text-xs sm:text-sm font-semibold hover:underline"
                  >
                    +91 63976 84456
                  </a>
                  <p className="text-gray-500 text-xs mt-1 font-medium">
                    Monday - Friday, 9:00 AM - 5:00 PM IST
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 sm:mt-8">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3 sm:mb-4">Follow Us</h3>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {[
                  { name: 'Twitter', url: 'https://twitter.com/codearena', color: 'from-blue-400 to-blue-600' },
                  { name: 'GitHub', url: 'https://github.com/codearena', color: 'from-gray-600 to-gray-800' },
                  { name: 'LinkedIn', url: 'https://linkedin.com/company/codearena', color: 'from-blue-500 to-blue-700' },
                  { name: 'Facebook', url: 'https://facebook.com/codearena', color: 'from-blue-600 to-indigo-600' },
                ].map((social) => (
                  <a 
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-white transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
                    aria-label={social.name}
                  >
                    <span className="sr-only">{social.name}</span>
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${social.color} flex items-center justify-center hover:scale-110 transition-all duration-300 font-bold text-xs sm:text-sm text-white shadow-sm hover:shadow-md`}>
                      {social.name[0]}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="order-1 xl:order-2 bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Send Us a Message</h2>
            
            {submitStatus && (
              <div className={`mb-3 sm:mb-4 p-3 rounded-lg border ${
                submitStatus.success 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                <div className="flex items-start">
                  {submitStatus.success ? (
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  )}
                  <span className="font-medium text-xs sm:text-sm">{submitStatus.message}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-900 font-medium hover:border-blue-300 text-xs sm:text-sm"
                  placeholder="Mahir Gaur"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-900 font-medium hover:border-blue-300 text-xs sm:text-sm"
                  placeholder="mahir@gmail.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-xs font-semibold text-gray-700 mb-1">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-900 font-medium hover:border-blue-300 text-xs sm:text-sm"
                >
                  <option value="" disabled>Select a subject</option>
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Billing Question">Billing Question</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-semibold text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-900 font-medium hover:border-blue-300 resize-none text-xs sm:text-sm"
                  placeholder="How can we help you?"
                ></textarea>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`group flex items-center justify-center w-full px-4 py-3 rounded-lg font-bold text-xs sm:text-sm transition-all duration-300 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isSubmitting
                      ? 'bg-blue-400 cursor-not-allowed opacity-75'
                      : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95'
                  } text-white`}
                >
                  <span className="flex items-center">
                    {isSubmitting ? (
                      'Sending...'
                    ) : (
                      <>
                        <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                        Send Message
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Map */}
        <div className="mt-8 sm:mt-12 bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <div className="h-48 sm:h-64 lg:h-80 w-full bg-gray-100 flex items-center justify-center relative overflow-hidden">
            <div className="text-center p-4 relative z-10 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <MapPin className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-1 sm:mb-2">Our Location</h3>
              <p className="text-gray-600 max-w-md font-medium text-xs sm:text-sm">
                Visit our office at 27.6062° N, 77.5973° E
              </p>
            </div>
            {/* Google Map Embed */}
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d14164.62215966557!2d77.59738581587676!3d27.60624771235988!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1693579200000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 opacity-60"
              title="AlgoBucks Office Location"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;