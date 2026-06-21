import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class Model3DViewer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private currentModel: THREE.Group | null = null;
  private animationId: number | null = null;
  private modelId: string = '';
  private resizeObserver: ResizeObserver;
  private disposed = false;

  constructor(container: HTMLElement) {
    this.container = container;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf5f5f5);

    const width = container.clientWidth || 200;
    const height = container.clientHeight || 200;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(3, 3, 5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 10;

    this.addLights();
    this.addGridHelper();

    this.animate();

    this.resizeObserver = new ResizeObserver(() => {
      this.onResize();
    });
    this.resizeObserver.observe(container);
  }

  private addLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    this.scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffaa66, 0.4);
    pointLight.position.set(-3, 2, -3);
    this.scene.add(pointLight);
  }

  private addGridHelper(): void {
    const gridHelper = new THREE.GridHelper(10, 10, 0xcccccc, 0xe0e0e0);
    gridHelper.position.y = -1.5;
    this.scene.add(gridHelper);
  }

  loadModel(modelId: string): void {
    this.modelId = modelId;

    if (this.currentModel) {
      this.scene.remove(this.currentModel);
      this.disposeModel(this.currentModel);
    }

    this.currentModel = this.createModel(modelId);
    if (this.currentModel) {
      this.scene.add(this.currentModel);
    }

    this.camera.position.set(3, 3, 5);
    this.controls.reset();
  }

  private createModel(modelId: string): THREE.Group {
    const group = new THREE.Group();
    const paperMaterial = new THREE.MeshStandardMaterial({
      color: 0xfff8e7,
      side: THREE.DoubleSide,
      flatShading: false,
      roughness: 0.8,
      metalness: 0.1
    });

    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xd4a574 });

    switch (modelId) {
      case 'rectangle-fold':
        this.createRectangleFold(group, paperMaterial, edgeMaterial);
        break;
      case 'triangle-fold':
        this.createTriangleFold(group, paperMaterial, edgeMaterial);
        break;
      case 'small-triangle':
        this.createSmallTriangle(group, paperMaterial, edgeMaterial);
        break;
      case 'square-twist':
        this.createSquareTwist(group, paperMaterial, edgeMaterial);
        break;
      case 'crane-base':
        this.createCraneBase(group, paperMaterial, edgeMaterial);
        break;
      default:
        this.createRectangleFold(group, paperMaterial, edgeMaterial);
    }

    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return group;
  }

  private createRectangleFold(group: THREE.Group, material: THREE.MeshStandardMaterial, edgeMat: THREE.LineBasicMaterial): void {
    const shape = new THREE.Shape();
    shape.moveTo(-1, -1);
    shape.lineTo(1, -1);
    shape.lineTo(1, 1);
    shape.lineTo(-1, 1);
    shape.lineTo(-1, -1);

    const geometry = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.01;
    group.add(mesh);

    const foldedShape = new THREE.Shape();
    foldedShape.moveTo(-1, -1);
    foldedShape.lineTo(0, -1);
    foldedShape.lineTo(0, 1);
    foldedShape.lineTo(-1, 1);
    foldedShape.lineTo(-1, -1);

    const foldedGeo = new THREE.ShapeGeometry(foldedShape);
    const foldedMesh = new THREE.Mesh(foldedGeo, material);
    foldedMesh.rotation.x = -Math.PI / 3;
    foldedMesh.position.set(0.5, 0.5, 0);
    group.add(foldedMesh);

    this.addEdges(geometry, edgeMat, group);
  }

  private createTriangleFold(group: THREE.Group, material: THREE.MeshStandardMaterial, edgeMat: THREE.LineBasicMaterial): void {
    const shape = new THREE.Shape();
    shape.moveTo(-1.2, -1);
    shape.lineTo(1.2, -1);
    shape.lineTo(0, 1.2);
    shape.lineTo(-1.2, -1);

    const geometry = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 4;
    mesh.rotation.z = 0.2;
    mesh.position.y = 0.3;
    group.add(mesh);

    const shape2 = new THREE.Shape();
    shape2.moveTo(-1.2, -1);
    shape2.lineTo(0, -1);
    shape2.lineTo(0, 1.2);
    shape2.lineTo(-1.2, -1);

    const geo2 = new THREE.ShapeGeometry(shape2);
    const mesh2 = new THREE.Mesh(geo2, material);
    mesh2.rotation.x = -Math.PI / 6;
    mesh2.rotation.y = Math.PI / 4;
    mesh2.position.set(0.3, 0.5, 0.2);
    group.add(mesh2);

    this.addEdges(geometry, edgeMat, group);
  }

  private createSmallTriangle(group: THREE.Group, material: THREE.MeshStandardMaterial, _edgeMat: THREE.LineBasicMaterial): void {
    for (let i = 0; i < 4; i++) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.8, 0.8);
      shape.lineTo(-0.8, 0.8);
      shape.lineTo(0, 0);

      const geometry = new THREE.ShapeGeometry(shape);
      const mesh = new THREE.Mesh(geometry, material);

      const angle = (i * Math.PI) / 2;
      mesh.rotation.x = -Math.PI / 3 - i * 0.15;
      mesh.rotation.y = angle;
      mesh.position.y = i * 0.15;
      group.add(mesh);
    }
  }

  private createSquareTwist(group: THREE.Group, material: THREE.MeshStandardMaterial, _edgeMat: THREE.LineBasicMaterial): void {
    const centerSize = 0.6;

    const centerShape = new THREE.Shape();
    centerShape.moveTo(-centerSize, -centerSize);
    centerShape.lineTo(centerSize, -centerSize);
    centerShape.lineTo(centerSize, centerSize);
    centerShape.lineTo(-centerSize, centerSize);
    centerShape.lineTo(-centerSize, -centerSize);

    const centerGeo = new THREE.ShapeGeometry(centerShape);
    const centerMesh = new THREE.Mesh(centerGeo, material);
    centerMesh.rotation.x = -Math.PI / 2;
    centerMesh.position.y = 0.02;
    group.add(centerMesh);

    const corners = [
      { x: -1, y: -1, rotZ: Math.PI / 4 },
      { x: 1, y: -1, rotZ: -Math.PI / 4 },
      { x: 1, y: 1, rotZ: Math.PI + Math.PI / 4 },
      { x: -1, y: 1, rotZ: Math.PI - Math.PI / 4 }
    ];

    corners.forEach((corner, i) => {
      const triShape = new THREE.Shape();
      triShape.moveTo(0, 0);
      triShape.lineTo(0.6, 0);
      triShape.lineTo(0, 0.6);
      triShape.lineTo(0, 0);

      const triGeo = new THREE.ShapeGeometry(triShape);
      const triMesh = new THREE.Mesh(triGeo, material);
      triMesh.position.set(corner.x, 0.3 + i * 0.05, corner.y);
      triMesh.rotation.x = -Math.PI / 3;
      triMesh.rotation.z = corner.rotZ;
      group.add(triMesh);
    });
  }

  private createCraneBase(group: THREE.Group, material: THREE.MeshStandardMaterial, _edgeMat: THREE.LineBasicMaterial): void {
    const baseShape = new THREE.Shape();
    baseShape.moveTo(0, -1);
    baseShape.lineTo(1, 0);
    baseShape.lineTo(0, 1);
    baseShape.lineTo(-1, 0);
    baseShape.lineTo(0, -1);

    const baseGeo = new THREE.ShapeGeometry(baseShape);
    const baseMesh = new THREE.Mesh(baseGeo, material);
    baseMesh.rotation.x = -Math.PI / 2;
    baseMesh.position.y = 0.01;
    group.add(baseMesh);

    for (let i = 0; i < 2; i++) {
      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.lineTo(0.8, -0.3);
      wingShape.lineTo(0.8, 0.3);
      wingShape.lineTo(0, 0);

      const wingGeo = new THREE.ShapeGeometry(wingShape);
      const wingMesh = new THREE.Mesh(wingGeo, material);
      wingMesh.position.set(i === 0 ? -0.3 : 0.3, 0.4 + i * 0.1, 0);
      wingMesh.rotation.y = i === 0 ? -Math.PI / 4 : Math.PI / 4;
      wingMesh.rotation.x = -Math.PI / 6;
      wingMesh.rotation.z = i === 0 ? 0.3 : -0.3;
      group.add(wingMesh);
    }

    const topShape = new THREE.Shape();
    topShape.moveTo(-0.3, 0);
    topShape.lineTo(0.3, 0);
    topShape.lineTo(0, 0.8);
    topShape.lineTo(-0.3, 0);

    const topGeo = new THREE.ShapeGeometry(topShape);
    const topMesh = new THREE.Mesh(topGeo, material);
    topMesh.position.set(0, 0.6, -0.2);
    topMesh.rotation.x = -Math.PI / 3;
    group.add(topMesh);
  }

  private addEdges(geometry: THREE.BufferGeometry, material: THREE.LineBasicMaterial, group: THREE.Group): void {
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, material);
    group.add(line);
  }

  private disposeModel(model: THREE.Group): void {
    const disposedMaterials = new Set<THREE.Material>();
    model.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
        child.geometry.dispose();
        const material = child.material;
        if (Array.isArray(material)) {
          material.forEach(m => {
            if (!disposedMaterials.has(m)) {
              m.dispose();
              disposedMaterials.add(m);
            }
          });
        } else if (!disposedMaterials.has(material)) {
          material.dispose();
          disposedMaterials.add(material);
        }
      }
    });
  }

  private animate = (): void => {
    if (this.disposed) return;

    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private onResize(): void {
    if (this.disposed) return;

    const width = this.container.clientWidth || 200;
    const height = this.container.clientHeight || 200;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  setSelected(selected: boolean): void {
    if (this.currentModel) {
      this.currentModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (selected) {
            mat.emissive = new THREE.Color(0x6699ff);
            mat.emissiveIntensity = 0.3;
          } else {
            mat.emissive = new THREE.Color(0x000000);
            mat.emissiveIntensity = 0;
          }
        }
      });
    }
  }

  getModelId(): string {
    return this.modelId;
  }

  destroy(): void {
    this.disposed = true;
    this.resizeObserver.disconnect();

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.currentModel) {
      this.scene.remove(this.currentModel);
      this.disposeModel(this.currentModel);
    }
    this.renderer.dispose();
    this.controls.dispose();
    this.renderer.domElement.remove();
  }
}
