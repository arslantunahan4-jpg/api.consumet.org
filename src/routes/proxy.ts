import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';

const routes = async (fastify: FastifyInstance) => {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { url, headers } = request.query as { url: string; headers?: string };

    if (!url) return reply.status(400).send("URL eksik");

    try {
      // Headerları çöz
      const decodedHeaders = headers ? JSON.parse(decodeURIComponent(headers)) : {};
      
      // Kendimizi gerçek bir tarayıcı gibi gösterelim (User-Agent hilesi)
      if (!decodedHeaders['User-Agent']) {
          decodedHeaders['User-Agent'] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36";
      }

      // Videoyu sunucu üzerinden çekiyoruz
      const response = await axios.get(url, {
        headers: decodedHeaders,
        responseType: 'stream', // Video akışı olduğu için stream kullanıyoruz
        validateStatus: () => true // Hata olsa bile bağlantıyı kesme
      });

      // Video bilgilerini (Content-Type) aynen ilet
      const contentType = response.headers['content-type'];
      if (contentType) reply.header('Content-Type', contentType);
      
      // CORS izni ver (Her yerden izlenebilsin)
      reply.header('Access-Control-Allow-Origin', '*');

      return reply.send(response.data);

    } catch (error) {
      console.error("Proxy Hatası:", error);
      return reply.status(500).send("Proxy Hatası Oluştu");
    }
  });
};

export default routes;
