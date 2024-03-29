from flask import Flask
from flask import request
from flask_cors import CORS, cross_origin
import os

from services.users_short import UsersShort
from services.home_activities import HomeActivities
from services.user_activities import UserActivities
from services.create_activity import CreateActivity
from services.create_reply import CreateReply
from services.search_activities import SearchActivities
from services.message_groups import MessageGroups
from services.messages import Messages
from services.create_message import CreateMessage
from services.show_activity import ShowActivities
from services.notifications_activities import NotificationsActivities

# HoneyComb
from opentelemetry import trace
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
# X-Ray
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.ext.flask.middleware import XRayMiddleware
#CloudWatch logs
import watchtower
import logging
from time import strftime
# Rollbar
import rollbar
import rollbar.contrib.flask
from flask import got_request_exception

# Cognito token verifier
from lib.cognito_jwt_token import CognitoJwtToken, extract_access_token, TokenVerifyError

# Configuring Logger to Use CloudWatch
# TODO - activate cloudwatch logs
#LOGGER = logging.getLogger(__name__)
#LOGGER.setLevel(logging.DEBUG)
#console_handler = logging.StreamHandler()
#cw_handler = watchtower.CloudWatchLogHandler(log_group='cruddur')
#LOGGER.addHandler(console_handler)
#LOGGER.addHandler(cw_handler)
#LOGGER.info("some message")

# X-Ray
# TODO - X-Ray
#xray_url = os.getenv("AWS_XRAY_URL")
#xray_recorder.configure(service='backend-flask', dynamic_naming=xray_url)

# HoneyComb
# Initialize tracing and an exporter that can send data to Honeycomb
provider = TracerProvider()
processor = BatchSpanProcessor(OTLPSpanExporter())
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)
tracer = trace.get_tracer(__name__)

app = Flask(__name__)
# Initialize automatic instrumentation with Flask
# HoneyComb
FlaskInstrumentor().instrument_app(app)
RequestsInstrumentor().instrument()
# Initialize XRayMiddleware
# TODO - X-Ray
#XRayMiddleware(app, xray_recorder)
# Init cognito token verifier
cognito_jwt_token = CognitoJwtToken(
  user_pool_id=os.getenv("AWS_COGNITO_USER_POOL_ID"), 
  user_pool_client_id=os.getenv("AWS_COGNITO_USER_POOL_CLIENT_ID"),
  region=os.getenv("AWS_DEFAULT_REGION")
)

frontend = os.getenv('FRONTEND_URL')
backend = os.getenv('BACKEND_URL')
origins = [frontend, backend]
cors = CORS(
  app, 
  resources={r"/api/*": {"origins": origins}},
  headers=['Content-Type', 'Authorization'], 
  expose_headers='Authorization',
  methods="OPTIONS,GET,HEAD,POST"
)

# TODO - activate cloudwatch logs
#@app.after_request
#def after_request(response):
#    timestamp = strftime('[%Y-%b-%d %H:%M]')
#    LOGGER.error('%s %s %s %s %s %s', timestamp, request.remote_addr, request.method, request.scheme, request.full_path, response.status)
#    return response

# Rollbar
rollbar_access_token = os.getenv('ROLLBAR_ACCESS_TOKEN')
@app.before_first_request
def init_rollbar():
    """init rollbar module"""
    rollbar.init(
        # access token
        rollbar_access_token,
        # environment name
        'production',
        # server root directory, makes tracebacks prettier
        root=os.path.dirname(os.path.realpath(__file__)),
        # flask already sets up logging
        allow_logging_basic_config=False)

    # send exceptions from `app` to rollbar, using flask's signal system.
    got_request_exception.connect(rollbar.contrib.flask.report_exception, app)

# Add people tracking
# This works when an error occurs but not when reporting a message with rollbar.report_message
from flask import Request
class CustomRequest(Request):
    @property
    def rollbar_person(self):
        # 'id' is required, 'username' and 'email' are indexed but optional.
        # all values are strings.
        # TODO -  This can be changed once we use authentification to get the real data
        return {'id': '1', 'username': 'hyahiaoui', 'email': 'test@example.com'}

app.request_class = CustomRequest

# Endpoint to test rollbar
@app.route('/rollbar/test')
def rollbar_test():
    rollbar.report_message('Hello World!', 'warning')
    return "Hello World!"

@app.route("/api/message_groups", methods=['GET'])
def data_message_groups():
  access_token = extract_access_token(request.headers)
  try:
    claims = cognito_jwt_token.verify(access_token)
    cognito_user_id = claims['sub']
    model = MessageGroups.run(cognito_user_id=cognito_user_id)
    if model['errors'] is not None:
      return model['errors'], 422
    else:
      return model['data'], 200

  except TokenVerifyError as e:
    app.logger.debug(e)
    return {}, 401

@app.route("/api/messages/@<string:handle>", methods=['GET'])
def data_messages(handle):
  user_sender_handle = 'andrewbrown'
  user_receiver_handle = request.args.get('user_reciever_handle')

  model = Messages.run(user_sender_handle=user_sender_handle, user_receiver_handle=user_receiver_handle)
  if model['errors'] is not None:
    return model['errors'], 422
  else:
    return model['data'], 200

@app.route("/api/messages", methods=['POST','OPTIONS'])
@cross_origin()
def data_create_message():
  user_sender_handle = 'andrewbrown'
  user_receiver_handle = request.json['user_receiver_handle']
  message = request.json['message']

  model = CreateMessage.run(message=message,user_sender_handle=user_sender_handle,user_receiver_handle=user_receiver_handle)
  if model['errors'] is not None:
    return model['errors'], 422
  else:
    return model['data'], 200

@app.route("/api/activities/home", methods=['GET'])
#@xray_recorder.capture('activities_home')
def data_home():
  access_token = extract_access_token(request.headers)
  home_activities = HomeActivities()
  try:
    claims = cognito_jwt_token.verify(access_token)
    # authenicatied request
    print("authenicated")
    print(claims)
    print(claims['username'])
    data = home_activities.run(cognito_user_id=claims['username'])
  except TokenVerifyError as e:
    # unauthenicatied request
    print(e)
    print("unauthenicated")
    data = home_activities.run()
  return data, 200

@app.route("/api/activities/notifications", methods=['GET'])
#@xray_recorder.capture('activities_users')
def data_notifications():
  data = NotificationsActivities.run()
  return data, 200

@app.route("/api/activities/@<string:handle>", methods=['GET'])
def data_handle(handle):
  model = UserActivities.run(handle)
  if model['errors'] is not None:
    return model['errors'], 422
  else:
    return model['data'], 200

@app.route("/api/activities/search", methods=['GET'])
def data_search():
  term = request.args.get('term')
  model = SearchActivities.run(term)
  if model['errors'] is not None:
    return model['errors'], 422
  else:
    return model['data'], 200

@app.route("/api/activities", methods=['POST','OPTIONS'])
@cross_origin()
def data_activities():
  create_activities = CreateActivity()
  user_handle  = 'hyahiaoui'
  message = request.json['message']
  ttl = request.json['ttl']
  model = create_activities.run(message, user_handle, ttl)
  if model['errors'] is not None:
    return model['errors'], 422
  else:
    return model['data'], 200

@app.route("/api/activities/<string:activity_uuid>", methods=['GET'])
#@xray_recorder.capture('activities_show')
def data_show_activity(activity_uuid):
  data = ShowActivity.run(activity_uuid=activity_uuid)
  return data, 200

@app.route("/api/activities/<string:activity_uuid>/reply", methods=['POST','OPTIONS'])
@cross_origin()
def data_activities_reply(activity_uuid):
  user_handle  = 'andrewbrown'
  message = request.json['message']
  model = CreateReply.run(message, user_handle, activity_uuid)
  if model['errors'] is not None:
    return model['errors'], 422
  else:
    return model['data'], 200

if __name__ == "__main__":
  app.run(debug=True)