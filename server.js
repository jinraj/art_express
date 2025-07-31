// Import the Fastify library.
// If you don't have Fastify installed, run: npm install fastify
const fastify = require('fastify')({
    logger: true // Enables Fastify's built-in logger for better insights
});

// Import the Fastify CORS plugin.
// If you don't have it installed, run: npm install @fastify/cors
const cors = require('@fastify/cors');

// Define the port the server will listen on.
const PORT = 5000;

// --- In-memory Data Store ---
// This array will act as our temporary database.
let items = [
    { id: 1, name: 'Item A', description: 'Description for Item A' },
    { id: 2, name: 'Item B', description: 'Description for Item B' },
    { id: 3, name: 'Item C', description: 'Description for Item C' }
];

// Helper to generate a unique ID for new items.
let nextId = items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;

// --- Register Plugins ---

// Register the CORS plugin.
// This allows requests from different origins (e.g., a frontend app running on a different port).
// You can configure CORS options here, e.g., { origin: 'http://localhost:8080' }
fastify.register(cors, {
    origin: '*', // Allows all origins. For production, specify your frontend's origin(s).
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Allowed headers
});

// --- API Endpoints ---

// 1. GET all items
// Route: /api/items
// Returns: An array of all items.
fastify.get('/api/items', async (request, reply) => {
    request.log.info('GET /api/items - All items requested');
    return items; // Fastify automatically serializes objects to JSON
});

// 2. GET a single item by ID
// Route: /api/items/:id
// Returns: The item with the specified ID, or a 404 if not found.
fastify.get('/api/items/:id', async (request, reply) => {
    // Fastify's params object contains route parameters.
    const id = parseInt(request.params.id);
    const item = items.find(item => item.id === id);

    if (item) {
        request.log.info(`GET /api/items/${id} - Item found:`, item);
        return item;
    } else {
        request.log.warn(`GET /api/items/${id} - Item not found`);
        reply.code(404).send({ message: 'Item not found' });
    }
});

// 3. POST a new item
// Route: /api/items
// Expects: JSON body with 'name' and 'description'.
// Returns: The newly created item.
fastify.post('/api/items', async (request, reply) => {
    // Fastify's body object contains the parsed request body.
    const { name, description } = request.body;

    // Basic validation: ensure name and description are provided.
    if (!name || !description) {
        request.log.warn('POST /api/items - Missing name or description');
        reply.code(400).send({ message: 'Name and description are required' });
        return; // Important to return after sending a reply
    }

    const newItem = {
        id: nextId++,
        name,
        description
    };

    items.push(newItem);
    request.log.info('POST /api/items - New item created:', newItem);
    reply.code(201).send(newItem); // Respond with the created item and a 201 Created status code.
});

// 4. PUT (Update) an existing item
// Route: /api/items/:id
// Expects: JSON body with 'name' and/or 'description'.
// Returns: The updated item, or a 404 if not found.
fastify.put('/api/items/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const { name, description } = request.body;

    const itemIndex = items.findIndex(item => item.id === id);

    if (itemIndex !== -1) {
        items[itemIndex] = {
            ...items[itemIndex], // Keep existing properties
            name: name || items[itemIndex].name, // Update name if provided, else keep old name
            description: description || items[itemIndex].description // Update description if provided, else keep old description
        };
        request.log.info(`PUT /api/items/${id} - Item updated:`, items[itemIndex]);
        return items[itemIndex];
    } else {
        request.log.warn(`PUT /api/items/${id} - Item not found for update`);
        reply.code(404).send({ message: 'Item not found' });
    }
});

// 5. DELETE an item
// Route: /api/items/:id
// Returns: A success message, or a 404 if not found.
fastify.delete('/api/items/:id', async (request, reply) => {
    const id = parseInt(request.params.id);

    const initialLength = items.length;
    items = items.filter(item => item.id !== id);

    if (items.length < initialLength) {
        request.log.info(`DELETE /api/items/${id} - Item deleted`);
        reply.code(204).send(); // No content to send back for 204
    } else {
        request.log.warn(`DELETE /api/items/${id} - Item not found for deletion`);
        reply.code(404).send({ message: 'Item not found' });
    }
});

// --- Start the server ---
const start = async () => {
    try {
        await fastify.listen({ port: PORT });
        fastify.log.info(`Server is running on http://localhost:${PORT}`);
        fastify.log.info('API Endpoints available:');
        fastify.log.info(`  GET    http://localhost:${PORT}/api/items`);
        fastify.log.info(`  GET    http://localhost:${PORT}/api/items/:id`);
        fastify.log.info(`  POST   http://localhost:${PORT}/api/items`);
        fastify.log.info(`  PUT    http://localhost:${PORT}/api/items/:id`);
        fastify.log.info(`  DELETE http://localhost:${PORT}/api/items/:id`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
