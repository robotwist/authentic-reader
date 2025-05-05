const { User, Source, UserSource } = require('./models');

async function subscribeAdminToAllSources() {
  try {
    console.log('Subscribing admin2 to all sources...');
    
    // Find admin2 user
    const admin = await User.findOne({
      where: { email: 'admin2@example.com' }
    });
    
    if (!admin) {
      console.error('Admin2 user not found');
      process.exit(1);
    }
    
    console.log(`Found admin user with ID: ${admin.id}`);
    
    // Get all sources
    const sources = await Source.findAll();
    
    if (sources.length === 0) {
      console.error('No sources found');
      process.exit(1);
    }
    
    console.log(`Found ${sources.length} sources to subscribe to`);
    
    // Subscribe admin to each source
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      
      // Check if already subscribed
      const existingSubscription = await UserSource.findOne({
        where: { userId: admin.id, sourceId: source.id }
      });
      
      if (existingSubscription) {
        console.log(`Admin already subscribed to ${source.name}`);
        continue;
      }
      
      // Create subscription
      await UserSource.create({
        userId: admin.id,
        sourceId: source.id,
        displayOrder: i + 1
      });
      
      console.log(`Subscribed admin to ${source.name}`);
    }
    
    console.log('Admin subscribed to all sources successfully');
  } catch (error) {
    console.error('Error subscribing admin to sources:', error);
    process.exit(1);
  }
}

// Execute the function
subscribeAdminToAllSources()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 