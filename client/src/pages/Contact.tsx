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
    <div className="min-h-screen bg-gray-50 text-gray-900 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 bg-clip-text text-transparent mb-4 sm:mb-6">
            Contact Us
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
            Have questions or feedback? We'd love to hear from you!
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">
          {/* Contact Information */}
          <div className="order-2 xl:order-1">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Get in Touch</h2>
            
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-start p-4 sm:p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 group">
                <div className="text-blue-600 mr-3 sm:mr-4 mt-1 flex-shrink-0 group-hover:text-blue-700 transition-colors duration-300">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-300">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Our Office</h3>
                  <div className="space-y-1 text-gray-600 mb-2 sm:mb-4 text-sm sm:text-base">
                    <p className="font-medium">NH-2 Delhi-Agra</p>
                    <p className="font-medium">GLA University, Mathura 281406</p>
                    <p className="font-medium">Uttar Pradesh, India</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start p-4 sm:p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 group">
                <div className="text-blue-600 mr-3 sm:mr-4 mt-1 flex-shrink-0 group-hover:text-blue-700 transition-colors duration-300">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-300">
                    <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Email Us</h3>
                  <a 
                    href="mailto:hello@algobucks.com" 
                    className="text-blue-600 hover:text-blue-700 transition-colors text-sm sm:text-base font-semibold hover:underline break-all"
                  >
                    hello@algobucks.com
                  </a>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2 font-medium">
                    We typically respond within 24 hours
                  </p>
                </div>
              </div>

              <div className="flex items-start p-4 sm:p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 group">
                <div className="text-blue-600 mr-3 sm:mr-4 mt-1 flex-shrink-0 group-hover:text-blue-700 transition-colors duration-300">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-300">
                    <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Call Us</h3>
                  <a 
                    href="tel:+916397684456" 
                    className="text-blue-600 hover:text-blue-700 transition-colors text-sm sm:text-base font-semibold hover:underline"
                  >
                    +91 63976 84456
                  </a>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2 font-medium">
                    Monday - Friday, 9:00 AM - 5:00 PM IST
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 sm:mt-12">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Follow Us</h3>
              <div className="flex flex-wrap gap-3 sm:gap-4">
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
                    className="text-gray-600 hover:text-white transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl"
                    aria-label={social.name}
                  >
                    <span className="sr-only">{social.name}</span>
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${social.color} flex items-center justify-center hover:scale-110 transition-all duration-300 font-bold text-sm sm:text-base text-white shadow-md hover:shadow-lg`}>
                      {social.name[0]}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="order-1 xl:order-2 bg-white rounded-2xl p-6 sm:p-8 lg:p-10 border border-gray-200 shadow-sm">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Send Us a Message</h2>
            
            {submitStatus && (
              <div className={`mb-4 sm:mb-6 p-4 rounded-xl border ${
                submitStatus.success 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                <div className="flex items-start">
                  {submitStatus.success ? (
                    <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                  )}
                  <span className="font-medium text-sm sm:text-base">{submitStatus.message}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-900 font-medium hover:border-blue-300 text-sm sm:text-base"
                  placeholder="Mahir Gaur"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-900 font-medium hover:border-blue-300 text-sm sm:text-base"
                  placeholder="mahir@gmail.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-900 font-medium hover:border-blue-300 text-sm sm:text-base"
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
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-900 font-medium hover:border-blue-300 resize-none text-sm sm:text-base"
                  placeholder="How can we help you?"
                ></textarea>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`group flex items-center justify-center w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base lg:text-lg transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
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
                        <Send className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
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
        <div className="mt-12 sm:mt-16 bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <div className="h-64 sm:h-80 lg:h-96 w-full bg-gray-100 flex items-center justify-center relative overflow-hidden">
            <div className="text-center p-6 relative z-10 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Our Location</h3>
              <p className="text-gray-600 max-w-md font-medium text-sm sm:text-base">
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