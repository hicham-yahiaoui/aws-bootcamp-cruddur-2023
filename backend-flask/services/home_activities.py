from datetime import datetime, timedelta, timezone

from lib.db import db

class HomeActivities:
  def run(self,cognito_user_id=None):
    # TODO - activate cloudwatch logs
    #LOGGER.info('Hello Cloudwatch! from  /api/activities/home')
    sql = db.template('activities','home')
    results = db.query_array_json(sql)
    return results