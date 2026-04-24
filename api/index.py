import sys
import os

# Add the parent directory to sys.path so we can import from 'backend'
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.app import app

# Prefix-stripping middleware for Vercel
class PrefixMiddleware(object):
    def __init__(self, app, prefix=''):
        self.app = app
        self.prefix = prefix

    def __call__(self, environ, start_response):
        if environ['PATH_INFO'].startswith(self.prefix):
            environ['PATH_INFO'] = environ['PATH_INFO'][len(self.prefix):]
            environ['SCRIPT_NAME'] = self.prefix
        return self.app(environ, start_response)

# Apply the middleware
app.wsgi_app = PrefixMiddleware(app.wsgi_app, prefix='/api/flask')
