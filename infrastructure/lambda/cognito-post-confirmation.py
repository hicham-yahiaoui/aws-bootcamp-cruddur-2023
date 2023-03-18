import psycopg
import os

# Connect to the database
conn = psycopg.connect(os.getenv('CONNECTION_URL'))

def lambda_handler(event, context):
    user = event['request']['userAttributes']
    print('userAttributes')
    print(user)

    user_display_name  = user['name']
    user_email         = user['email']
    user_handle        = user['preferred_username']
    user_cognito_id    = user['sub']

    sql = f"""
         INSERT INTO public.users (
          display_name,
          email,
          handle,
          cognito_user_id
          )
        VALUES(%s,%s,%s,%s)
      """
    print('SQL Statement ----')
    print(sql)
    # Insert the user information into the RDS database
    with conn.cursor() as cursor:
        cursor.execute(sql,(
        user_display_name,
        user_email,
        user_handle,
        user_cognito_id
        ))
    conn.commit()

    # Return a success message
    return event