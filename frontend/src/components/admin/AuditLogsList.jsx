import React from 'react';

const AuditLogsList = ({ auditLogs, darkMode }) => {
  return (
    <div>
      <div className={`overflow-x-auto rounded-lg border ${darkMode ? 'border-dark-border' : 'border-gray-200'}`}>
        <table className={`min-w-full divide-y ${darkMode ? 'divide-dark-border' : 'divide-gray-200'}`}>
          <thead className={darkMode ? 'bg-dark-tertiary' : 'bg-gray-50'}>
            <tr>
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Time</th>
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>User</th>
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Action</th>
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Entity</th>
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Details</th>
            </tr>
          </thead>
          <tbody className={`${darkMode ? 'divide-y divide-dark-border' : 'divide-y divide-gray-200'}`}>
            {auditLogs.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center">No audit logs found</td>
              </tr>
            ) : (
              auditLogs.map(log => (
                <tr key={log.id} className={darkMode ? 'bg-dark-secondary' : 'bg-white'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.user ? (
                      <div className="text-sm">
                        <div>{log.user.username || log.user.email}</div>
                        <div className="text-xs text-gray-500">{log.user.email}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">System</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      log.action === 'CREATE'
                        ? darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                        : log.action === 'UPDATE'
                          ? darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                          : log.action === 'DELETE'
                            ? darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                            : darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {log.entity_type}
                      {log.entity_id && <span className="text-gray-500"> #{log.entity_id}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 whitespace-pre-wrap">{log.details}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogsList;
