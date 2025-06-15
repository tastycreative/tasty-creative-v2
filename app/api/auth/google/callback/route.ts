// app/api/auth/google/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (error) {
      // Return an HTML page with error handling
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Error</title>
            <style>
              body { 
                font-family: system-ui, -apple-system, sans-serif; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh; 
                margin: 0; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .container { 
                text-align: center; 
                padding: 2rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
              }
              .error { color: #ff6b6b; }
              button {
                background: #ff6b6b;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                margin-top: 1rem;
              }
              button:hover { background: #ff5252; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">Authentication Failed</h1>
              <p>Error: ${error}</p>
              <button onclick="window.close()">Close Window</button>
              <script>
                // Try to close the popup or redirect to parent
                if (window.opener) {
                  window.opener.postMessage({ 
                    type: 'GOOGLE_AUTH_ERROR', 
                    error: '${error}' 
                  }, '*');
                  window.close();
                } else {
                  // If not in popup, redirect after 3 seconds
                  setTimeout(() => {
                    window.location.href = '/apps/generative-ai/dataset';
                  }, 3000);
                }
              </script>
            </div>
          </body>
        </html>
        `,
        { 
          status: 400,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    if (!code) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Error</title>
            <style>
              body { 
                font-family: system-ui, -apple-system, sans-serif; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh; 
                margin: 0; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .container { 
                text-align: center; 
                padding: 2rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
              }
              .error { color: #ff6b6b; }
              button {
                background: #ff6b6b;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                margin-top: 1rem;
              }
              button:hover { background: #ff5252; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">Authentication Failed</h1>
              <p>No authorization code received</p>
              <button onclick="window.close()">Close Window</button>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ 
                    type: 'GOOGLE_AUTH_ERROR', 
                    error: 'no_code' 
                  }, '*');
                  window.close();
                } else {
                  setTimeout(() => {
                    window.location.href = '/apps/generative-ai/dataset';
                  }, 3000);
                }
              </script>
            </div>
          </body>
        </html>
        `,
        { 
          status: 400,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    try {
      // Exchange authorization code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET1!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: new URL('/api/auth/google/callback', request.url).toString(),
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('Token exchange error:', errorData);
        throw new Error('Failed to exchange code for token');
      }

      const tokenData = await tokenResponse.json();

      // Get user info
      const userResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        }
      );

      if (!userResponse.ok) {
        throw new Error('Failed to get user info');
      }

      const userInfo = await userResponse.json();

      // Return success page with tokens
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Successful</title>
            <style>
              body { 
                font-family: system-ui, -apple-system, sans-serif; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh; 
                margin: 0; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .container { 
                text-align: center; 
                padding: 2rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
              }
              .success { color: #51cf66; }
              .spinner {
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top: 3px solid #51cf66;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
                margin: 1rem auto;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              .user-info {
                margin: 1rem 0;
                padding: 1rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
              }
              .avatar {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                margin: 0 auto 0.5rem;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="success">✓ Authentication Successful!</h1>
              <div class="user-info">
                ${userInfo.picture ? `<img src="${userInfo.picture}" alt="Profile" class="avatar">` : ''}
                <p><strong>${userInfo.name}</strong></p>
                <p>${userInfo.email}</p>
              </div>
              <div class="spinner"></div>
              <p>Redirecting you back to the application...</p>
              <script>
                const authData = {
                  type: 'GOOGLE_AUTH_SUCCESS',
                  tokens: ${JSON.stringify(tokenData)},
                  userInfo: ${JSON.stringify(userInfo)}
                };
                
                // If opened in popup, send message to parent and close
                if (window.opener) {
                  window.opener.postMessage(authData, '*');
                  setTimeout(() => {
                    window.close();
                  }, 1500);
                } else {
                  // If not in popup, store in localStorage and redirect
                  localStorage.setItem('google_access_token', '${tokenData.access_token}');
                  if ('${tokenData.refresh_token}') {
                    localStorage.setItem('google_refresh_token', '${tokenData.refresh_token}');
                  }
                  localStorage.setItem('google_user_info', JSON.stringify(${JSON.stringify(userInfo)}));
                  
                  setTimeout(() => {
                    window.location.href = '/apps/generative-ai/dataset';
                  }, 2000);
                }
              </script>
            </div>
          </body>
        </html>
        `,
        { 
          status: 200,
          headers: { 'Content-Type': 'text/html' }
        }
      );

    } catch (tokenError) {
      console.error('Token exchange error:', tokenError);
      
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Error</title>
            <style>
              body { 
                font-family: system-ui, -apple-system, sans-serif; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh; 
                margin: 0; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .container { 
                text-align: center; 
                padding: 2rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
              }
              .error { color: #ff6b6b; }
              button {
                background: #ff6b6b;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                margin-top: 1rem;
              }
              button:hover { background: #ff5252; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">Authentication Failed</h1>
              <p>Failed to process authentication. Please try again.</p>
              <button onclick="window.close()">Close Window</button>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ 
                    type: 'GOOGLE_AUTH_ERROR', 
                    error: 'token_exchange_failed' 
                  }, '*');
                  window.close();
                } else {
                  setTimeout(() => {
                    window.location.href = '/apps/generative-ai/dataset';
                  }, 3000);
                }
              </script>
            </div>
          </body>
        </html>
        `,
        { 
          status: 500,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

  } catch (error) {
    console.error('Callback error:', error);
    
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Error</title>
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh; 
              margin: 0; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container { 
              text-align: center; 
              padding: 2rem;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 12px;
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .error { color: #ff6b6b; }
            button {
              background: #ff6b6b;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 16px;
              margin-top: 1rem;
            }
            button:hover { background: #ff5252; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">Authentication Error</h1>
            <p>An unexpected error occurred. Please try again.</p>
            <button onclick="window.close()">Close Window</button>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'GOOGLE_AUTH_ERROR', 
                  error: 'unexpected_error' 
                }, '*');
                window.close();
              } else {
                setTimeout(() => {
                  window.location.href = '/apps/generative-ai/dataset';
                }, 3000);
              }
            </script>
          </div>
        </body>
      </html>
      `,
      { 
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}