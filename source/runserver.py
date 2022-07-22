"""
This script runs the FlaskWebProject application using a development server.
"""
print("Starting up...\n")
from os import environ
from FlaskWebProject import app
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

if __name__ == '__main__':

    HOST = environ.get('SERVER_HOST', '0.0.0.0')
    #HOST = environ.get('SERVER_HOST', 'localhost')
    try:
        PORT = int(environ.get('SERVER_PORT', '8080'))
    except ValueError:
        PORT = 8080
    app.run(HOST, PORT, threaded=True)

# No caching at all for API endpoints.
@app.after_request
def add_header(response):
    # response.cache_control.no_store = True
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response    
