import React from 'react';

const TestApp: React.FC = () => {
  return (
    <div
      style={{
        width: '400px',
        padding: '20px',
        background: 'white',
        color: 'black',
        minHeight: '200px',
      }}
    >
      <h1>ShieldPro Test</h1>
      <p>If you can see this, React is working!</p>
      <button onClick={() => alert('Button works!')}>Test Button</button>
    </div>
  );
};

export default TestApp;
