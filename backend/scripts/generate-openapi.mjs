import { writeFileSync } from 'node:fs';
const string = (extra={}) => ({type:'string',...extra});
const ref = name => ({$ref:`#/components/schemas/${name}`});
const object = (properties, required=Object.keys(properties)) => ({type:'object',additionalProperties:false,properties,required});
const array = items => ({type:'array',items});
const id = string({description:'ID opaco; los BIGINT se representan como cadenas.'});
const date = string({format:'date-time'});
const status = string({enum:['pendiente','revision','solucionado']});
const nullableString = {type:['string','null']};
const password = string({minLength:6,description:'Máximo 72 bytes UTF-8 (bcrypt); no equivale a 72 caracteres Unicode.',writeOnly:true});
const personal = {nombre:string({minLength:1,maxLength:150}),matricula:string({maxLength:30,pattern:'^[a-z0-9][a-z0-9._-]{0,29}$'}),email:string({format:'email',maxLength:254,description:'Exactamente matrícula normalizada + @virtual.utsc.edu.mx.'})};
const schemas={
  Error:object({error:object({code:string(),message:string(),fields:{type:'object',additionalProperties:string()}},['code','message']),requestId:string({format:'uuid'})}),
  User:object({id,nombre:string(),matricula:string(),email:string({format:'email'}),rol:string({enum:['estudiante','personal']}),createdAt:date}),
  AuthResult:object({token:string({description:'Token opaco de 32 bytes; guardar en Keychain/Keystore.'}),expiresAt:date,user:ref('User')}),
  Register:object({...personal,password,rol:string({enum:['estudiante']})},[...Object.keys(personal),'password']),
  Login:object({email:string({format:'email'}),password}),
  PersonalData:object({...personal,currentPassword:password},Object.keys(personal)),
  Logout:object({installationId:string({format:'uuid'})},[]),
  StatusUpdate:object({id,from:status,to:status,note:string({maxLength:500}),createdAt:date,authorId:id,authorName:string()}),
  Report:object({id,folio:string(),ownerId:id,ownerNombre:string(),titulo:string({maxLength:80}),descripcion:string({maxLength:500}),areaId:id,area:string(),categoriaId:id,categoria:string(),estado:status,evidenceUrl:nullableString,createdAt:date,updatedAt:date,statusUpdates:array(ref('StatusUpdate'))},['id','folio','ownerId','ownerNombre','titulo','descripcion','areaId','area','categoriaId','categoria','estado','evidenceUrl','createdAt','updatedAt']),
  CreateReport:object({titulo:string({minLength:1,maxLength:80}),descripcion:string({minLength:1,maxLength:500}),areaId:{type:'integer',minimum:1},categoriaId:{type:'integer',minimum:1},photo:string({format:'binary',description:'JPEG/PNG/WebP decodificable, hasta MAX_PHOTO_BYTES (por defecto 5 MiB). MIME comprobado por contenido.'})},['titulo','descripcion','areaId','categoriaId']),
  ChangeStatus:object({estado:status,note:string({maxLength:500,default:''})},['estado']),
  Summary:object(Object.fromEntries(['total','pendiente','revision','solucionado'].map(k=>[k,{type:'integer',minimum:0}]))),
  Catalogs:object({areas:array(object({id:{type:'integer'},nombre:string()})),categorias:array(object({id:{type:'integer'},nombre:string()})),estados:array(object({codigo:status,nombre:string()}))}),
  Notice:object({id,reportId:id,folio:string(),titulo:string(),ownerNombre:string(),area:string(),estado:status,tipo:string({enum:['aviso','estado']}),tituloAviso:string(),occurredAt:date}),
  Statistics:object({periodo:string({enum:['semana','mes','anio']}),asOf:date,counts:object(Object.fromEntries(['pendiente','revision','solucionado'].map(k=>[k,{type:'integer'}]))),total:{type:'integer'},categories:array(object({categoria:string(),value:{type:'integer'}})),areaTop:{anyOf:[object({area:string(),total:{type:'integer'},categoria:string()}),{type:'null'}]},serie:array(object({date:string({format:'date'}),label:string(),value:{type:'integer'}}))}),
  Device:object({token:string({minLength:1,maxLength:512}),plataforma:string({enum:['android','ios']})}),
};
for (const [name,item] of [['ReportPage','Report'],['NoticePage','Notice']]) schemas[name]=object({items:array(ref(item)),nextCursor:nullableString,total:{type:'integer',minimum:0}});
const json = schema => ({'application/json':{schema}});
const errorResponses = Object.fromEntries([400,401,403,404,409,413,429,500].map(code=>[code,{description:({400:'Entrada inválida',401:'Sesión ausente/expirada',403:'Sin permiso',404:'Recurso inexistente o inaccesible',409:'Duplicado',413:'Carga excesiva',429:'Límite de solicitudes',500:'Error interno'})[code],content:json(ref('Error'))}]));
const paths={};
function operation(path,method,summary,{response,body,publicAccess=false,code=200,multipart=false,parameters=[],description=''}={}) {
  paths[path] ||= {};
  paths[path][method]={summary,description,security:publicAccess?[]:[{bearerAuth:[]}],parameters,
    ...(body?{requestBody:{required:true,content:{[multipart?'multipart/form-data':'application/json']:{schema:ref(body)}}}}:{}),
    responses:{...errorResponses,[code]:{description:'Correcto',...(response?{content:json(ref(response))}:{})}}};
}
const query=(name,schema,description='')=>({in:'query',name,required:false,schema,description});
const param=name=>({in:'path',name,required:true,schema:string({format:'uuid'})});
const paging=[query('limit',{type:'integer',minimum:1,maximum:100,default:50}),query('cursor',string({maxLength:500}),'Cursor de la página anterior; conservar filtros.')];
operation('/auth/register','post','Registrar estudiante',{body:'Register',response:'AuthResult',publicAccess:true,code:201});
operation('/auth/login','post','Iniciar sesión',{body:'Login',response:'AuthResult',publicAccess:true});
operation('/auth/logout','post','Revocar sesión actual',{body:'Logout',code:204});
operation('/auth/me','get','Usuario activo de la sesión',{response:'User'});
operation('/users/me','patch','Editar datos personales',{body:'PersonalData',response:'User',description:'Contraseña actual obligatoria cuando cambia el correo; matrícula y correo deben coincidir.'});
operation('/catalogs','get','Catálogos activos y estados',{response:'Catalogs'});
operation('/reports','post','Crear reporte pendiente',{body:'CreateReport',response:'Report',code:201,multipart:true,description:'Solo estudiantes. El servidor determina autor, UUID, folio y fechas. También admite JSON sin foto.'});
paths['/reports'].post.requestBody.content['application/json']={schema:object(Object.fromEntries(Object.entries(schemas.CreateReport.properties).filter(([name])=>name!=='photo')))};
operation('/reports','get','Reportes autorizados paginados',{response:'ReportPage',parameters:[...paging,query('estado',status),query('own',{type:'boolean'},'Forzar propios incluso para personal.'),query('areaId',{type:'integer',minimum:1}),query('categoriaId',{type:'integer',minimum:1}),query('area',string({maxLength:100})),query('search',string({maxLength:80}))],description:'Orden descendente (creado_en,id). Estudiante solo propios; personal listado general.'});
operation('/reports/summary','get','Conteos completos por estado',{response:'Summary',parameters:[query('own',{type:'boolean'})]});
operation('/reports/{id}','get','Detalle autorizado e historial',{response:'Report',parameters:[param('id')],description:'statusUpdates excluye el evento inicial de creación.'});
operation('/reports/{id}/status','patch','Cambiar estado con nota',{body:'ChangeStatus',response:'Report',parameters:[param('id')],description:'Solo personal. Rutina transaccional, reapertura permitida; estado repetido no añade evento.'});
operation('/reports/{id}/evidence','get','Evidencia privada',{parameters:[param('id')]});
paths['/reports/{id}/evidence'].get.responses[200]={description:'Foto autorizada; Cache-Control: private, no-store',content:Object.fromEntries(['image/jpeg','image/png','image/webp'].map(mime=>[mime,{schema:string({format:'binary'})}]))};
operation('/staff/statistics','get','Estadísticas institucionales',{response:'Statistics',parameters:[query('periodo',string({enum:['semana','mes','anio'],default:'mes'}))],description:'Solo personal. Un asOf UTC, límites de días naturales America/Mexico_City, sin futuros; serie de siete días independiente del periodo.'});
operation('/staff/notices','get','Un aviso por reporte según estado actual',{response:'NoticePage',parameters:[...paging,query('tipo',string({enum:['todas','aviso','estado']})),query('estado',status)],description:'Solo personal. Orden descendente (ocurrido_en,reporte_id); sin marcas de lectura.'});
operation('/devices/{installationId}','put','Asociar o renovar dispositivo',{body:'Device',code:204,parameters:[param('installationId')]});
operation('/devices/{installationId}','delete','Desvincular dispositivo propio',{code:204,parameters:[param('installationId')]});
paths['/health']={get:{summary:'Disponibilidad mínima',security:[],responses:{200:{description:'Proceso disponible',content:json(object({status:string({const:'ok'})}))}}}};
const api={openapi:'3.1.0',info:{title:'NexoU API',version:'1.0.0'},servers:[{url:'http://localhost:3000/api/v1'}],paths,components:{securitySchemes:{bearerAuth:{type:'http',scheme:'bearer',bearerFormat:'opaque'}},schemas}};
writeFileSync(new URL('../openapi.json',import.meta.url),JSON.stringify(api,null,2)+'\n');
