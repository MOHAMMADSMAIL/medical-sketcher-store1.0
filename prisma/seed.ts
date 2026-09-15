import { PrismaClient, Role, ProductStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
const categories = [{name:'Literature',slug:'literature'},{name:'Philosophy',slug:'philosophy'},{name:'Strategy',slug:'strategy'}];
const authors = [{name:'Sun Tzu',slug:'sun-tzu'},{name:'Marcus Aurelius',slug:'marcus-aurelius'},{name:'Jane Austen',slug:'jane-austen'},{name:'F. Scott Fitzgerald',slug:'f-scott-fitzgerald'}];
const products = [
  {slug:'art-of-war',title:'The Art of War',author:'sun-tzu',category:'strategy',price:12.5},
  {slug:'meditations',title:'Meditations',author:'marcus-aurelius',category:'philosophy',price:10.5},
  {slug:'pride-and-prejudice',title:'Pride and Prejudice',author:'jane-austen',category:'literature',price:9.5},
  {slug:'great-gatsby',title:'The Great Gatsby',author:'f-scott-fitzgerald',category:'literature',price:11.5}
];
async function main(){
  const passwordHash=await bcrypt.hash('ChangeMe123!',12);
  for(const [email,role] of [['owner@aurelia.test',Role.OWNER],['admin@aurelia.test',Role.ADMIN],['customer@aurelia.test',Role.CUSTOMER]] as const) await prisma.user.upsert({where:{email},update:{role,passwordHash},create:{email,name:role,passwordHash,role}});
  for(const c of categories) await prisma.category.upsert({where:{slug:c.slug},update:{name:c.name},create:c});
  for(const a of authors) await prisma.author.upsert({where:{slug:a.slug},update:{name:a.name},create:a});
  for(const p of products){const author=await prisma.author.findUniqueOrThrow({where:{slug:p.author}});const category=await prisma.category.findUniqueOrThrow({where:{slug:p.category}});await prisma.product.upsert({where:{slug:p.slug},update:{title:p.title,price:p.price,status:ProductStatus.PUBLISHED,authorId:author.id,categoryId:category.id,description:`Aurelia Books edition of ${p.title}`},create:{slug:p.slug,title:p.title,price:p.price,status:ProductStatus.PUBLISHED,authorId:author.id,categoryId:category.id,description:`Aurelia Books edition of ${p.title}`}})}
  const page=await prisma.page.upsert({where:{slug:'home'},update:{title:'Aurelia Books',status:'PUBLISHED'},create:{slug:'home',title:'Aurelia Books',status:'PUBLISHED'}});
  await prisma.section.deleteMany({where:{pageId:page.id}}); await prisma.section.create({data:{pageId:page.id,type:'hero',content:{eyebrow:'A considered collection',headline:'Books for the beautifully curious.'}}});
  for(const [key,subject] of [['welcome','Welcome to Aurelia Books'],['order-confirmation','Your order is confirmed'],['payment-confirmation','Your payment is confirmed'],['download-ready','Your book is ready']] as const) await prisma.emailTemplate.upsert({where:{key},update:{subject,body:subject},create:{key,subject,body:subject}});
}
main().finally(()=>prisma.$disconnect());
