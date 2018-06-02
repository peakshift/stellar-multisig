import os
from stellar_base.address import Address

publickey = os.environ['SENDER_PUBLIC_KEY']
# Address.get() throws Exception (python 2.7)
# Horizon query fails
address = Address(address=publickey)
address.get()

print("Balances: {}".format(address.balances))
print("Sequence Number: {}".format(address.sequence))
print("Flags: {}".format(address.flags))
print("Signers: {}".format(address.signers))
print("Data: {}".format(address.data))