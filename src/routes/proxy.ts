import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';

const routes = async (fastify: FastifyInstance) => {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { url, headers } = request.query as { url: string; headers?: string };

    if (!url) return reply.status(400).send("URL parametresi eksik.");

    try {
      // Headerları çözüyoruz
      let customHeaders = {};
      if (headers) {
        try {
          customHeaders = JSON.parse(decodeURIComponent(headers));
        } catch (e) {
          console.error("Header parse hatası", e);
        }
      }

      // Güvenlik duvarlarını aşmak için tarayıcı gibi davranıyoruz
      const fetchHeaders = {
        ...customHeaders,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        // Referer yoksa, videonun kendi domainini referer yap
        'Referer': customHeaders['Referer'] || new URL(url).origin + '/',
        'Origin': new URL(url).origin
      };

      // Videoyu "Stream" olarak çekiyoruz (İndirmeden aktarma)
      const response = await axios({
        url: url,
        method: 'GET',
        responseType: 'stream', // Önemli: Dosyayı belleğe alma, akıt
        headers: fetchHeaders,
        validateStatus: () => true, // Hata kodu gelse bile bağlantıyı koparma
      });

      // Kaynak sunucudan gelen başlıkları (Video süresi, türü vb.) aynen ilet
      Object.keys(response.headers).forEach(key => {
        reply.header(key, response.headers[key]);
      });

      // CORS İzinleri
      reply.header('Access-Control-Allow-Origin', '*');

      // Akışı başlat
      return reply.send(response.data);

    } catch (error) {
      console.error("Proxy Tünel Hatası:", error);
      return reply.status(500).send("Proxy Bağlantı Hatası");
    }
  });
};

export default routes;
