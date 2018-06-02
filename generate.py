from stellar_base.utils import StellarMnemonic
from stellar_base.keypair import Keypair

sm = StellarMnemonic()
m = sm.generate()

print m

kp = Keypair.deterministic(m)
publickey = kp.address().decode()
seed = kp.seed().decode()

print publickey
print seed
