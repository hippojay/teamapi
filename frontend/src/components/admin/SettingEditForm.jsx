import React from 'react';

const SettingEditForm = ({ setting, value, onChange, darkMode }) => {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-2 py-1 border rounded ${
          darkMode 
            ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
            : 'bg-white border-gray-300 text-gray-900'
        }`}
        rows={setting.key === 'allowed_email_domains' ? 5 : 2}
        placeholder={setting.key === 'allowed_email_domains' ? "example.com\ngmail.com\ndomain.org" : ""}
      />
      {setting.key === 'allowed_email_domains' && (
        <div className="text-xs mt-1 text-gray-500">
          Enter one domain per line or separate with commas.<br />
          Users will only be able to register with email addresses from these domains.
        </div>
      )}
    </div>
  );
};

export default SettingEditForm;
