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
        'Failed to send message. Please try again later or contact us directly at replyearnbycode@gmail.com';
      
      setSubmitStatus({
        success: false,
        message: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-100 dark:from-gray-950 dark:via-black dark:to-gray-900 text-sky-900 dark:text-green-300 py-2 sm:py-3 lg:py-4 px-3 sm:px-4 lg:px-5 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-sky-600 via-sky-500 to-sky-700 dark:from-green-400 dark:via-green-300 dark:to-green-500 bg-clip-text text-transparent mb-2 sm:mb-3 transition-all duration-300">
            Contact Us
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-sky-700 dark:text-green-300 max-w-2xl mx-auto leading-relaxed px-3 transition-colors duration-300 font-medium">
            Have questions or feedback? We'd love to hear from you!
          </p>
        </div>
  
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Contact Information */}
          <div className="order-2 xl:order-1">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-sky-900 dark:text-green-400 mb-3 sm:mb-4 lg:mb-5 transition-colors duration-300">Get in Touch</h2>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="group flex items-start p-3 sm:p-4 lg:p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl border border-sky-200/50 dark:border-green-800/30 shadow-lg hover:shadow-xl hover:border-sky-300/70 dark:hover:border-green-700/50 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
                <div className="text-sky-600 dark:text-green-400 mr-2 sm:mr-3 mt-1 flex-shrink-0 group-hover:text-sky-700 dark:group-hover:text-green-300 transition-colors duration-300">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-10 lg:h-10 bg-gradient-to-br from-sky-100 to-sky-200 dark:from-green-900/50 dark:to-gray-800/50 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-sky-900 dark:text-green-400 mb-1 sm:mb-2 transition-colors duration-300">Our Office</h3>
                  <div className="space-y-0.5 text-sky-700 dark:text-green-300 mb-1 text-xs sm:text-sm transition-colors duration-300">
                    <p className="font-semibold">NH-2 Delhi-Agra</p>
                    <p className="font-semibold">GLA University, Mathura 281406</p>
                    <p className="font-semibold">Uttar Pradesh, India</p>
                  </div>
                </div>
              </div>
  
              <div className="group flex items-start p-3 sm:p-4 lg:p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl border border-sky-200/50 dark:border-green-800/30 shadow-lg hover:shadow-xl hover:border-sky-300/70 dark:hover:border-green-700/50 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
                <div className="text-sky-600 dark:text-green-400 mr-2 sm:mr-3 mt-1 flex-shrink-0 group-hover:text-sky-700 dark:group-hover:text-green-300 transition-colors duration-300">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-10 lg:h-10 bg-gradient-to-br from-sky-100 to-sky-200 dark:from-green-900/50 dark:to-gray-800/50 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-sky-900 dark:text-green-400 mb-1 sm:mb-2 transition-colors duration-300">Email Us</h3>
                  <a 
                    href="mailto:replyearnbycode@gmail.com" 
                    className="text-sky-600 dark:text-green-400 hover:text-sky-800 dark:hover:text-green-300 transition-colors duration-300 text-xs sm:text-sm font-bold hover:underline break-all block mb-0.5"
                  >
                    replyearnbycode@gmail.com
                  </a>
                  <p className="text-sky-500 dark:text-green-300/70 text-xs font-medium transition-colors duration-300">
                    We typically respond within 24 hours
                  </p>
                </div>
              </div>
  
              <div className="group flex items-start p-3 sm:p-4 lg:p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl border border-sky-200/50 dark:border-green-800/30 shadow-lg hover:shadow-xl hover:border-sky-300/70 dark:hover:border-green-700/50 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
                <div className="text-sky-600 dark:text-green-400 mr-2 sm:mr-3 mt-1 flex-shrink-0 group-hover:text-sky-700 dark:group-hover:text-green-300 transition-colors duration-300">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-10 lg:h-10 bg-gradient-to-br from-sky-100 to-sky-200 dark:from-green-900/50 dark:to-gray-800/50 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-sky-900 dark:text-green-400 mb-1 sm:mb-2 transition-colors duration-300">Call Us</h3>
                  <a 
                    href="tel:+916397684456" 
                    className="text-sky-600 dark:text-green-400 hover:text-sky-800 dark:hover:text-green-300 transition-colors duration-300 text-xs sm:text-sm font-bold hover:underline block mb-0.5"
                  >
                    +91 63976 84456
                  </a>
                  <p className="text-sky-500 dark:text-green-300/70 text-xs font-medium transition-colors duration-300">
                    Monday - Friday, 9:00 AM - 5:00 PM IST
                  </p>
                </div>
              </div>
            </div>
  
            <div className="mt-4 sm:mt-6 lg:mt-6">
              <h3 className="text-sm sm:text-base lg:text-lg font-bold text-sky-900 dark:text-green-400 mb-2 sm:mb-3 lg:mb-4 transition-colors duration-300">Follow Us</h3>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {[
                  { name: 'Twitter', url: 'https://twitter.com/codearena', color: 'from-sky-400 to-sky-600', darkColor: 'dark:from-green-500 dark:to-green-700' },
                  { name: 'GitHub', url: 'https://github.com/codearena', color: 'from-sky-500 to-sky-700', darkColor: 'dark:from-green-600 dark:to-green-800' },
                  { name: 'LinkedIn', url: 'https://linkedin.com/company/codearena', color: 'from-sky-600 to-sky-800', darkColor: 'dark:from-green-700 dark:to-green-900' },
                  { name: 'Facebook', url: 'https://facebook.com/codearena', color: 'from-sky-500 to-indigo-600', darkColor: 'dark:from-green-600 dark:to-green-800' },
                ].map((social) => (
                  <a 
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-700 dark:text-green-300 hover:text-white dark:hover:text-white transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-black rounded-xl"
                    aria-label={social.name}
                  >
                    <span className="sr-only">{social.name}</span>
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br ${social.color} ${social.darkColor} flex items-center justify-center hover:scale-110 hover:rotate-6 transition-all duration-300 font-bold text-xs sm:text-sm text-white shadow-lg hover:shadow-xl`}>
                      {social.name[0]}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
  
          {/* Contact Form */}
          <div className="order-1 xl:order-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl p-3 sm:p-4 lg:p-5 border border-sky-200/50 dark:border-green-800/30 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-sky-900 dark:text-green-400 mb-3 sm:mb-4 lg:mb-5 transition-colors duration-300">Send Us a Message</h2>
            
            {submitStatus && (
              <div className={`mb-3 sm:mb-4 p-2 sm:p-3 rounded-lg border transition-all duration-300 ${
                submitStatus.success 
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                  : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-start">
                  {submitStatus.success ? (
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2 mt-0.5 flex-shrink-0" />
                  )}
                  <span className="font-semibold text-xs sm:text-sm">{submitStatus.message}</span>
                </div>
              </div>
            )}
  
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs sm:text-sm font-bold text-sky-800 dark:text-green-400 mb-1 transition-colors duration-300">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-sky-200/60 dark:border-green-700/40 rounded-lg focus:ring-2 focus:ring-sky-500 dark:focus:ring-green-400 focus:border-sky-500 dark:focus:border-green-400 transition-all duration-300 text-sky-900 dark:text-green-200 font-medium hover:border-sky-400 dark:hover:border-green-600 text-xs sm:text-sm placeholder-sky-400 dark:placeholder-green-400/60 shadow-sm hover:shadow-md focus:shadow-lg"
                  placeholder="Mahir Gaur"
                />
              </div>
  
              <div>
                <label htmlFor="email" className="block text-xs sm:text-sm font-bold text-sky-800 dark:text-green-400 mb-1 transition-colors duration-300">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-sky-200/60 dark:border-green-700/40 rounded-lg focus:ring-2 focus:ring-sky-500 dark:focus:ring-green-400 focus:border-sky-500 dark:focus:border-green-400 transition-all duration-300 text-sky-900 dark:text-green-200 font-medium hover:border-sky-400 dark:hover:border-green-600 text-xs sm:text-sm placeholder-sky-400 dark:placeholder-green-400/60 shadow-sm hover:shadow-md focus:shadow-lg"
                  placeholder="mahir@gmail.com"
                />
              </div>
  
              <div>
                <label htmlFor="subject" className="block text-xs sm:text-sm font-bold text-sky-800 dark:text-green-400 mb-1 transition-colors duration-300">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-sky-200/60 dark:border-green-700/40 rounded-lg focus:ring-2 focus:ring-sky-500 dark:focus:ring-green-400 focus:border-sky-500 dark:focus:border-green-400 transition-all duration-300 text-sky-900 dark:text-green-200 font-medium hover:border-sky-400 dark:hover:border-green-600 text-xs sm:text-sm shadow-sm hover:shadow-md focus:shadow-lg"
                >
                  <option value="" disabled className="text-sky-400 dark:text-green-400/60">Select a subject</option>
                  <option value="General Inquiry" className="text-sky-900 dark:text-green-200">General Inquiry</option>
                  <option value="Technical Support" className="text-sky-900 dark:text-green-200">Technical Support</option>
                  <option value="Billing Question" className="text-sky-900 dark:text-green-200">Billing Question</option>
                  <option value="Partnership" className="text-sky-900 dark:text-green-200">Partnership</option>
                  <option value="Other" className="text-sky-900 dark:text-green-200">Other</option>
                </select>
              </div>
  
              <div>
                <label htmlFor="message" className="block text-xs sm:text-sm font-bold text-sky-800 dark:text-green-400 mb-1 transition-colors duration-300">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-sky-200/60 dark:border-green-700/40 rounded-lg focus:ring-2 focus:ring-sky-500 dark:focus:ring-green-400 focus:border-sky-500 dark:focus:border-green-400 transition-all duration-300 text-sky-900 dark:text-green-200 font-medium hover:border-sky-400 dark:hover:border-green-600 resize-none text-xs sm:text-sm placeholder-sky-400 dark:placeholder-green-400/60 shadow-sm hover:shadow-md focus:shadow-lg"
                  placeholder="How can we help you?"
                ></textarea>
              </div>
  
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`group flex items-center justify-center w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-green-400 focus:ring-offset-2 dark:focus:ring-offset-black ${
                    isSubmitting
                      ? 'bg-sky-400 dark:bg-green-600 cursor-not-allowed opacity-75'
                      : 'bg-gradient-to-r from-sky-500 to-sky-600 dark:from-green-600 dark:to-green-700 hover:from-sky-600 hover:to-sky-700 dark:hover:from-green-700 dark:hover:to-green-800 hover:scale-105 active:scale-95 transform'
                  } text-white`}
                >
                  <span className="flex items-center">
                    {isSubmitting ? (
                      'Sending...'
                    ) : (
                      <>
                        <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 group-hover:translate-x-1 transition-transform duration-300" />
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
        <div className="mt-6 sm:mt-8 lg:mt-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl overflow-hidden border border-sky-200/50 dark:border-green-800/30 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="h-48 sm:h-60 lg:h-64 w-full bg-gradient-to-br from-sky-100 to-sky-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center relative overflow-hidden transition-colors duration-300">
            <div className="text-center p-3 sm:p-4 relative z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl border border-sky-200/60 dark:border-green-700/40 shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-sky-100 to-sky-200 dark:from-green-900/50 dark:to-gray-800/50 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 transition-colors duration-300 shadow-lg">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-sky-600 dark:text-green-400" />
              </div>
              <h3 className="text-sm sm:text-base lg:text-lg font-bold text-sky-900 dark:text-green-400 mb-1 sm:mb-2 transition-colors duration-300">Our Location</h3>
              <p className="text-sky-700 dark:text-green-300 max-w-md font-semibold text-xs sm:text-sm transition-colors duration-300">
                Visit our office at 27.6062° N, 77.5973° E
              </p>
            </div>
            {/* Google Map Embed */}
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d14164.62215966557!2d77.59738581587676!3d27.60624771235988!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1693579200000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ 
                border: 0,
                filter: 'invert(0) hue-rotate(0deg)',
                transition: 'filter 0.3s ease'
              }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 opacity-50 dark:opacity-30 dark:invert dark:hue-rotate-180 transition-all duration-300"
              title="EarnByCode Office Location"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Contact;