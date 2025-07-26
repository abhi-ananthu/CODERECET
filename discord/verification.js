const { client } = require('./db-client.js');

async function verifyUser(updateDoc) {
  try {
    // Connect for this operation
    const db = client.db('ngo');
    const collection = db.collection('verification');
    const result = await collection.insertOne(updateDoc);
    return result;
  } catch (err) {
    console.error('Error updating session:', err);
    throw err;
  } finally {
    // Close connection after operation
  }
}

async function checkVerified(filter) {
  try {
    // Connect for this operation
    const db = client.db('ngo');
    const collection = db.collection('verification');
    console.log('\nUpdating session(s)...');
    const result = await collection.findOne(filter);
    if (result != null) return true;
    return false;
  } catch (err) {
    console.error('Error updating session:', err);
    throw err;
  } finally {
    // Close connection after operation
  }
}

async function getVerifiedUser(filter) {
  try {
    // Connect for this operation
    const db = client.db('ngo');
    const collection = db.collection('verification');
    console.log('\nUpdating session(s)...');
    const result = await collection.findOne(filter);
    return result;
  } catch (err) {
    console.error('Error updating session:', err);
    throw err;
  } finally {
    // Close connection after operation
  }
}

module.exports = { verifyUser, checkVerified, getVerifiedUser };
