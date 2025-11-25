import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';

const routes = async (fastify: FastifyInstance) => {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    // URL ve Header parametrelerini al
    const { url, headers } = request.query as { url: string; headers?: string };

    if (!url) return reply.status(400).send("URL parametresi zorunludur.");

    try {
      // Headerları JSON formatından çöz
      const decodedHeaders = headers ? JSON.parse(decodeURIComponent(headers)) : {};

      // Anti-Bot Korumasını Atlatmak İçin Kritik Ayarlar
      // 1. Gerçek bir tarayıcı User-Agent'ı kullan
      const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
      
      // 2. Referer bilgisini manipüle et (Eğer kaynak 'Referer' istiyorsa onu kullan, yoksa boş gönder)
      // Çoğu site kendi domainini referer olarak ister.
      const requestHeaders = {
        ...decodedHeaders,
        'User-Agent': userAgent,
        // Referer'ı dinamik olarak videonun geldiği domain yapıyoruz
        'Referer': new URL(url).origin + '/', 
        'Origin': new URL(url).origin
      };

      // 3. Axios ile videoyu 'stream' (akış) olarak çek
      const response = await axios.get(url, {
        headers: requestHeaders,
        responseType: 'stream', // Videoyu indirmeden parça parça aktarır
        validateStatus: () => true, // Hata kodu gelse bile bağlantıyı koparma
        timeout: 15000 // 15 saniye zaman aşımı
      });

      // 4. Kaynak siteden gelen başlıkları (Content-Type vb.) temizle ve ilet
      const contentType = response.headers['content-type'];
      const contentLength = response.headers['content-length'];

      if (contentType) reply.header('Content-Type', contentType);
      if (contentLength) reply.header('Content-Length', contentLength);
      
      // CORS sorununu tamamen kaldır
      reply.header('Access-Control-Allow-Origin', '*');
      reply.header('Access-Control-Allow-Methods', 'GET');

      // Veriyi React'a akıt
      return reply.send(response.data);

    } catch (error) {
      console.error("Proxy Hatası:", error);
      return reply.status(500).send("Proxy Sunucu Hatası");
    }
  });
};

export default routes;
