import express from 'express';
import cors from 'cors';
import pkg from 'agora-access-token';

const { RtcTokenBuilder, RtcRole } = pkg;

const app = express();
app.use(cors());

const APP_ID = 'ec70b661b8554e4cb1d7e225b40364e4';
const APP_CERTIFICATE = 'e239b98dfc9f4bd995f993115a268cfc';

app.get('/generateAgoraToken', (req, res) => {
  const channelName = req.query.channelName;
  if (!channelName) {
    return res.status(400).json({ error: 'channel name is required' });
  }

  const uid = 0; // Set to 0 for a unique user ID to be generated by Agora
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    role,
    privilegeExpiredTs
  );

  return res.json({ token });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Token server is running on port ${PORT}`);
});
