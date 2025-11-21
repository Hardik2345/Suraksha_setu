const Resource = require('../models/Resource');

// GET /api/resources
exports.listResources = async (req, res) => {
  try {
    const { type, search, lat, lng, radius = 10 } = req.query;

    let query = { isActive: true };
    if (type) query.type = type;
    if (search) query.$text = { $search: search };

    let resources;
    if (lat && lng) {
      resources = await Resource.find({
        ...query,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: radius * 1000
          }
        }
      }).populate('createdBy', 'name');
    } else {
      resources = await Resource.find(query).populate('createdBy', 'name');
    }

    res.json({ success: true, count: resources.length, data: resources });
  } catch (err) {
    console.error('Error fetching resources:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch resources' });
  }
};

// POST /api/resources (Admin only)
exports.createResource = async (req, res) => {
  try {
    const {
      name, type, address, city, state, pincode, lat, lng,
      phone, email, website, services, capacity, operatingHours
    } = req.body;

    if (!name || !type || !address || !lat || !lng || !phone) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const resource = await Resource.create({
      name,
      type,
      location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)], address, city, state, pincode },
      contact: { phone, email, website },
      services: services || [],
      capacity,
      operatingHours,
      createdBy: req.user && req.user._id
    });

    res.status(201).json({ success: true, message: 'Resource created successfully', data: resource });
  } catch (err) {
    console.error('Error creating resource:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create resource' });
  }
};

// PUT /api/resources/:id
exports.updateResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });

    const allowedUpdates = ['name','type','address','city','state','pincode','phone','email','website','services','capacity','currentOccupancy','operatingHours','isActive'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (['phone','email','website'].includes(field)) resource.contact[field] = req.body[field];
        else if (['address','city','state','pincode'].includes(field)) resource.location[field] = req.body[field];
        else resource[field] = req.body[field];
      }
    });

    if (req.body.lat && req.body.lng) resource.location.coordinates = [parseFloat(req.body.lng), parseFloat(req.body.lat)];
    await resource.save();

    res.json({ success: true, message: 'Resource updated successfully', data: resource });
  } catch (err) {
    console.error('Error updating resource:', err);
    res.status(500).json({ success: false, message: 'Failed to update resource' });
  }
};

// DELETE /api/resources/:id (soft delete)
exports.deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    resource.isActive = false;
    await resource.save();
    res.json({ success: true, message: 'Resource deleted successfully' });
  } catch (err) {
    console.error('Error deleting resource:', err);
    res.status(500).json({ success: false, message: 'Failed to delete resource' });
  }
};

// GET /api/resources/:id
exports.getResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id).populate('createdBy', 'name');
    if (!resource || !resource.isActive) return res.status(404).json({ success: false, message: 'Resource not found' });
    res.json({ success: true, data: resource });
  } catch (err) {
    console.error('Error fetching resource:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch resource' });
  }
};
