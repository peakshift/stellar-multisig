import os
import requests

publickey = os.environ['SENDER_PUBLIC_KEY']
response = requests.get('https://friendbot.stellar.org/?addr=' + publickey)
print response
